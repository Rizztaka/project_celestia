import express, { type NextFunction, type Request, type Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/core/errors/app-error.js';
const mocks = vi.hoisted(() => ({ account: vi.fn(), characters: vi.fn() }));
vi.mock('../accounts/account.repository.js', () => ({
  GenshinAccountRepository: class {
    findByUserId = mocks.account;
  },
}));
vi.mock('../characters/character.repository.js', () => ({
  GenshinCharacterRepository: class {
    findByAccountId = mocks.characters;
  },
}));
vi.mock('./endgame.service.js', () => ({ EndgameService: class {} }));
import { EndgameController } from './endgame.controller.js';
const rules = {
  difficulty: 'EASY',
  elements: ['Pyro', 'Hydro', 'Electro'],
  openingKeys: [],
  guestKeys: [],
  selectedKeys: ['Bennett', 'Unowned'],
};
function application() {
  const app = express();
  app.use(express.json());
  app.post(
    '/preview',
    (req, _res, next) => {
      req.user = { id: 'authenticated-owner' } as Request['user'];
      next();
    },
    new EndgameController().previewTheaterCast,
  );
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    res.status(error instanceof AppError ? error.statusCode : 500).json({
      success: false,
      error: { code: error instanceof AppError ? error.errorCode : 'INTERNAL_SERVER_ERROR' },
    });
  });
  return app;
}
describe('Theater cast preview HTTP composition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.account.mockResolvedValue({ id: 'owned-account' });
    mocks.characters.mockResolvedValue([
      { characterKey: 'Bennett', level: 70 },
      { characterKey: 'Diona', level: 69 },
    ]);
  });
  it('loads only the authenticated account roster, without writing state or counting unowned selections', async () => {
    const response = await request(application()).post('/preview').send(rules);
    expect(response.status).toBe(200);
    expect(mocks.account).toHaveBeenCalledWith('authenticated-owner');
    expect(mocks.characters).toHaveBeenCalledWith('owned-account');
    expect(response.body.data.result).toMatchObject({
      qualifiedCount: 1,
      selectedKeys: ['Bennett'],
      invalidSelectedKeys: ['Unowned'],
      ready: false,
    });
    expect(response.body.data.explanations.join(' ')).toContain('Planning preset');
  });
  it.each([
    { elements: ['Pyro', 'Pyro', 'Hydro'] },
    { userId: 'another-owner' },
    { selectedKeys: Array(27).fill('Bennett') },
  ])('rejects invalid scenario input %j before reading the account', async (overrides) => {
    const response = await request(application())
      .post('/preview')
      .send({ ...rules, ...overrides });
    expect(response.status).toBe(422);
    expect(mocks.account).not.toHaveBeenCalled();
  });
  it('returns an empty cast when the authenticated user has no account', async () => {
    mocks.account.mockResolvedValue(null);
    const response = await request(application()).post('/preview').send(rules);
    expect(response.status).toBe(200);
    expect(response.body.data.result.qualifiedCount).toBe(0);
    expect(mocks.characters).not.toHaveBeenCalled();
  });
});
