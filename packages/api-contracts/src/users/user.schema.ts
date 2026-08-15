import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address format'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username must not exceed 30 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters long'), // <-- Added password validation
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
