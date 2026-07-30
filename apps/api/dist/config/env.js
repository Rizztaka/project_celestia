import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z.string().default("4000"),
    // DATABASE_URL will be added later when we configure Prisma
});
export const env = envSchema.parse(process.env);
