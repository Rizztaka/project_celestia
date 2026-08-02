import { UserRepository } from "./user.repository.js";
// Replace: import type { CreateUserInput } from './user.validation.js';
import type { CreateUserInput } from "@celestia/api-contracts";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(data: CreateUserInput) {
    // Business Rule 1: Email must be unique
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error("Email is already registered.");
    }

    // Business Rule 2: Username must be unique
    const existingUsername = await this.userRepository.findByUsername(
      data.username,
    );
    if (existingUsername) {
      throw new Error("Username is already taken.");
    }

    // If all rules pass, save to the database
    return this.userRepository.create(data);
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("User not found.");
    }
    return user;
  }
}
