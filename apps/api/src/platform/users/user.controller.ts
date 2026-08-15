import { createUserSchema } from '@celestia/api-contracts';
import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { UserService } from './user.service.js';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Arrow functions automatically bind 'this' — no need for .bind() in routes
  createUser = async (req: Request, res: Response) => {
    // 1. Validate request body — Zod throws ZodError if invalid,
    //    which the global error handler converts to a 400 response
    const validatedData = createUserSchema.parse(req.body);

    // 2. Delegate to service (business rules live there, not here)
    const user = await this.userService.createUser(validatedData);

    // 3. Return standardized success response
    res.status(201).json(successResponse(user, 'User created successfully'));
  };

  getUser = async (req: Request, res: Response) => {
    const userId = req.params.id as string;

    const user = await this.userService.getUserById(userId);

    res.status(200).json(successResponse(user, 'User retrieved successfully'));
  };
}
