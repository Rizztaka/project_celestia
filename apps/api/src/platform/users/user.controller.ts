import type { Request, Response } from "express";
import { UserService } from "./user.service.js";
// Replace: import { createUserSchema } from './user.validation.js';
import { createUserSchema } from "@celestia/api-contracts";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // We use arrow functions to automatically bind 'this'
  createUser = async (req: Request, res: Response) => {
    // 1. Validate request body (Zod will throw if invalid)
    const validatedData = createUserSchema.parse(req.body);

    // 2. Call service
    const user = await this.userService.createUser(validatedData);

    // 3. Return consistent response structure
    res.status(201).json({
      success: true,
      data: user,
      message: "User created successfully",
    });
  };

  getUser = async (req: Request, res: Response) => {
    // 1. Extract params and strictly type as string
    const userId = req.params.id as string;

    // 2. Call service
    const user = await this.userService.getUserById(userId);

    // 3. Return consistent response structure
    res.status(200).json({
      success: true,
      data: user,
      message: "User retrieved successfully",
    });
  };
}
