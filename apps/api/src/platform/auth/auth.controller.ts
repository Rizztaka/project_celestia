import { loginSchema,registerSchema } from '@celestia/api-contracts';
import type { Request, Response } from 'express';

import { successResponse } from '@/core/utils/response.js';

import { UserService } from '../users/user.service.js';
import { AuthService } from './auth.service.js';

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    // UserService is used here to fetch the current user's profile.
    // AuthController communicates with the users domain through its
    // public interface — never through UserRepository directly.
    this.userService = new UserService();
  }

  /**
   * POST /api/v1/auth/register
   *
   * Validates the request body, delegates to AuthService, and returns
   * the new user object (without password) plus a JWT access token.
   */
  register = async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body);
    const result = await this.authService.register(validatedData);
    res.status(201).json(successResponse(result, 'Registration successful'));
  };

  /**
   * POST /api/v1/auth/login
   *
   * Validates the request body, delegates to AuthService, and returns
   * the authenticated user (without password) plus a JWT access token.
   */
  login = async (req: Request, res: Response) => {
    const validatedData = loginSchema.parse(req.body);
    const result = await this.authService.login(validatedData);
    res.status(200).json(successResponse(result, 'Login successful'));
  };

  /**
   * GET /api/v1/auth/me
   *
   * Returns the currently authenticated user's safe profile.
   * Protected by requireAuth — req.user.id is guaranteed to be set.
   * Used by the frontend to restore a session from a stored JWT.
   */
  me = async (req: Request, res: Response) => {
    // req.user is set by requireAuth middleware — it is always present here
    const user = await this.userService.getUserById(req.user!.id);
    res.status(200).json(successResponse(user, 'Profile retrieved successfully'));
  };
}
