import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { UserService } from './user.service.js';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * GET /api/v1/users/:id
   *
   * Protected by requireAuth.  Enforces self-only access: the authenticated
   * user may only retrieve their own profile.  The ownership rule lives in
   * UserService.getOwnProfile so it is independently testable and reusable.
   *
   * req.user.id is guaranteed to be set by requireAuth before this handler runs.
   */
  getUser = async (req: Request, res: Response): Promise<void> => {
    const requesterId = req.user!.id; // set by requireAuth middleware
    const targetId = req.params.id as string;

    const user = await this.userService.getOwnProfile(requesterId, targetId);

    res.status(200).json(successResponse(user, 'User retrieved successfully'));
  };
}
