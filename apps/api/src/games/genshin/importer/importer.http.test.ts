import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ImportSelection, ImportSnapshot } from './importer.repository.js';

const mocks = vi.hoisted(() => ({ readSnapshot: vi.fn(), commit: vi.fn(), readMetadata: vi.fn() }));
vi.mock('./importer.repository.js', () => ({
  GenshinImportRepository: class {
    readSnapshot = mocks.readSnapshot;
    commit = mocks.commit;
    readMetadata = mocks.readMetadata;
  },
}));
vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: '4000',
    DATABASE_URL: 'postgresql://localhost/placeholder',
    JWT_SECRET: 'local-import-http-test-secret-with-more-than-32-characters',
    JWT_EXPIRY: '1h',
  },
}));
vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    session: { findFirst: async () => ({ id: 'fixture-session' }) },
    user: { findUnique: async ({ where }: { where: { id: string } }) => ({ id: where.id }) },
  },
}));
import { createApp } from '@/app.js';

const secret = 'local-import-http-test-secret-with-more-than-32-characters';
const token = (userId = 'user-a') =>
  jwt.sign({ sid: 'fixture-session' }, secret, { algorithm: 'HS256', subject: userId });
let api = supertest(createApp());
const input = {
  requestVersion: 1,
  payload: { format: 'GOOD', version: 2, materials: { Mora: 50 } },
  sections: ['materials'],
};
const previewUrl = '/api/v1/games/genshin/import/preview';
const commitUrl = '/api/v1/games/genshin/import';
beforeEach(() => {
  api = supertest(createApp());
  vi.resetAllMocks();
  mocks.readSnapshot.mockResolvedValue(null);
  mocks.readMetadata.mockResolvedValue([]);
  mocks.commit.mockImplementation(
    async (_id: string, validate: (state: ImportSnapshot) => ImportSelection) => validate(null),
  );
});
describe('Import HTTP flow', () => {
  it('requires authentication for import status', async () => {
    expect((await api.get(`${commitUrl}/status`)).status).toBe(401);
    expect(mocks.readMetadata).not.toHaveBeenCalled();
  });
  it('returns only the authenticated owner’s metadata without writes', async () => {
    const response = await api
      .get(`${commitUrl}/status?userId=victim`)
      .auth(token(), { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.body.data.sections).toHaveLength(4);
    expect(mocks.readMetadata).toHaveBeenCalledWith('user-a');
    expect(mocks.commit).not.toHaveBeenCalled();
  });
  it.each([previewUrl, commitUrl])('requires authentication for %s', async (url) => {
    expect((await api.post(url).send(input)).status).toBe(401);
    expect(mocks.readSnapshot).not.toHaveBeenCalled();
    expect(mocks.commit).not.toHaveBeenCalled();
  });
  it('previews and commits using only the authenticated owner', async () => {
    const preview = await api.post(previewUrl).auth(token(), { type: 'bearer' }).send(input);
    expect(preview.status).toBe(200);
    expect(mocks.readSnapshot).toHaveBeenCalledWith('user-a');
    expect(mocks.commit).not.toHaveBeenCalled();
    const result = await api
      .post(commitUrl)
      .auth(token(), { type: 'bearer' })
      .send({ ...input, previewToken: preview.body.data.previewToken, confirmClear: [] });
    expect(result.status).toBe(200);
    expect(result.body.data).toEqual({
      charactersImported: 0,
      weaponsImported: 0,
      artifactsImported: 0,
      materialsImported: 1,
      sections: ['materials'],
    });
    expect(mocks.commit).toHaveBeenCalledWith('user-a', expect.any(Function));
  });
  it('rejects caller-supplied identity fields', async () => {
    const response = await api
      .post(previewUrl)
      .auth(token(), { type: 'bearer' })
      .send({ ...input, userId: 'victim' });
    expect(response.status).toBe(400);
    expect(mocks.readSnapshot).not.toHaveBeenCalled();
  });
  it('rejects another user’s preview token', async () => {
    const preview = await api.post(previewUrl).auth(token(), { type: 'bearer' }).send(input);
    const result = await api
      .post(commitUrl)
      .auth(token('user-b'), { type: 'bearer' })
      .send({ ...input, previewToken: preview.body.data.previewToken, confirmClear: [] });
    expect(result.status).toBe(409);
    expect(mocks.commit).not.toHaveBeenCalled();
  });
  it('cannot use a preview token as an access token', async () => {
    const preview = await api.post(previewUrl).auth(token(), { type: 'bearer' }).send(input);
    expect(
      (
        await api
          .post(previewUrl)
          .auth(preview.body.data.previewToken, { type: 'bearer' })
          .send(input)
      ).status,
    ).toBe(401);
  });
  it('rejects legacy imports with a recovery message and no writes', async () => {
    const result = await api.post(commitUrl).auth(token(), { type: 'bearer' }).send(input.payload);
    expect(result.status).toBe(400);
    expect(result.body.error.message).toContain('Preview your import first');
    expect(mocks.commit).not.toHaveBeenCalled();
  });
  it('reports schema errors as JSON 400', async () => {
    const result = await api
      .post(previewUrl)
      .auth(token(), { type: 'bearer' })
      .send({ ...input, payload: { format: 'invalid' } });
    expect(result.status).toBe(400);
    expect(result.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
  });
});
