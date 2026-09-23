import type { User } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';

import type { CreateUserWithHashInput } from './user.service.js';

export class UserRepository {
  /**
   * Persists a new user account.
   *
   * Accepts `CreateUserWithHashInput` — the caller has already hashed the
   * password.  The mapping from `passwordHash` (internal contract) to the
   * Prisma schema's `password` column (storage concern) is the sole
   * responsibility of this method.  No hashing or business logic belongs here.
   */
  async create(data: CreateUserWithHashInput): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.passwordHash, // explicit mapping at the persistence boundary
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }
}
