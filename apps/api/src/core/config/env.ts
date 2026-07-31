import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("4000"),
  DATABASE_URL: z.string().url(), // Added this line
});

export const env = envSchema.parse(process.env);
