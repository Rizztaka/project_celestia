import type { CompanionSummaryResponse } from '@celestia/api-contracts';
import express, { type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/core/errors/app-error.js';
import { errorResponse } from '@/core/utils/response.js';

import { companionSummaryRoutes } from './companion-summary.routes.js';
import { companionSummaryService } from './companion-summary.service.js';

const TEST_JWT_SECRET = 'test-only-jwt-secret-exactly-40-chars!!!';

vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-only-jwt-secret-exactly-40-chars!!!',
    JWT_EXPIRY: '1h',
  },
}));

vi.mock('@/core/middleware/auth.middleware.js', () => ({
  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('UNAUTHORIZED', 'Authentication required.'));
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, TEST_JWT_SECRET) as { userId: string };
      req.user = { id: decoded.userId };
      next();
    } catch {
      return res.status(401).json(errorResponse('UNAUTHORIZED', 'Invalid or expired token.'));
    }
  },
}));

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/', companionSummaryRoutes);

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    const known = error instanceof AppError;
    res
      .status(known ? error.statusCode : 500)
      .json(
        errorResponse(
          known ? error.errorCode : 'INTERNAL_SERVER_ERROR',
          known ? error.message : 'An unexpected error occurred',
        ),
      );
  });
  return app;
}

describe('CompanionSummary HTTP Boundary', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.restoreAllMocks();
    app = createApp();
  });

  const validSummaryMock: CompanionSummaryResponse = {
    contractVersion: 1,
    timestamp: new Date().toISOString(),
    accountScope: 'authenticated',
    isPartialAccount: false,
    missingDataCaveats: [],
    primaryAction: {
      category: 'BUILD_INVESTMENT',
      headline: 'Priority Upgrade',
      subtext: 'High-impact resin investment',
      targetRoute: '/roster',
      priority: 'HIGH',
    },
    readyBuildsSummary: {
      readyCount: 4,
      totalAssessed: 8,
      targetEncounter: 'abyss_12',
      topReadyCharacters: [],
    },
    topMarginalInvestments: [],
    endgameSnapshot: {
      abyssReady: false,
      abyssScore: 60,
      onslaughtReady: false,
      theaterMaxActsEstimated: 4,
      suggestedAction: 'Reinforce teams',
    },
    narrativeOverview: ['Overview point 1'],
  };

  it('rejects unauthenticated request to /intelligence/summary with 401', async () => {
    const res = await supertest(app).get('/intelligence/summary');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns companion summary for authenticated user with 200', async () => {
    vi.spyOn(companionSummaryService, 'getSummary').mockResolvedValueOnce(validSummaryMock);

    const token = jwt.sign({ userId: 'user-1' }, TEST_JWT_SECRET);
    const res = await supertest(app)
      .get('/intelligence/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.contractVersion).toBe(1);
    expect(res.body.data.primaryAction.headline).toBe('Priority Upgrade');
  });

  it('returns public showcase summary for valid UID with 200 without auth', async () => {
    vi.spyOn(companionSummaryService, 'getPublicShowcaseSummary').mockResolvedValueOnce({
      ...validSummaryMock,
      accountScope: 'public_showcase',
      isPartialAccount: true,
    });

    const res = await supertest(app).get('/public/uid/800000001/intelligence/summary');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accountScope).toBe('public_showcase');
  });

  it('rejects invalid UID format with 400', async () => {
    const res = await supertest(app).get('/public/uid/not-a-valid-uid/intelligence/summary');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Invalid Genshin UID format');
  });
});
