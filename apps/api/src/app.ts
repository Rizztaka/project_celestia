import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import cors from "cors";
import { ZodError } from "zod";
import { logger } from "@/core/logger/logger.js";
import { AppError } from "@/core/errors/app-error.js";
import { errorResponse } from "@/core/utils/response.js";
import { userRoutes } from "./platform/users/user.routes.js";
import { authRoutes } from "./platform/auth/auth.routes.js";

export const app = express();

// ============================================================
// Security and Core Middleware
// ============================================================

app.use(helmet());
app.use(cors());
app.use(express.json());

// Request Logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "Incoming request");
  next();
});

// ============================================================
// API v1 Router
//
// All domain routes are mounted here so they share the /api/v1 prefix
// and can be managed consistently as new modules are added.
// ============================================================

const v1Router = express.Router();

v1Router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Platform routes
v1Router.use("/auth", authRoutes);
v1Router.use("/users", userRoutes);

app.use("/api/v1", v1Router);

// ============================================================
// Global Error Handler
//
// Order matters — most specific checks must come first.
//
// 1. AppError  → domain errors with a known HTTP status code
// 2. ZodError  → validation failures from request parsing
// 3. Everything else → unexpected 500
// ============================================================

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Domain errors thrown by services — carry their own status code
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(errorResponse(err.errorCode, err.message));
  }

  // Zod validation errors thrown by schema.parse() in controllers
  if (err instanceof ZodError) {
    return res.status(400).json(
      errorResponse(
        "VALIDATION_ERROR",
        err.errors[0]?.message ?? "Validation failed",
      ),
    );
  }

  // Unexpected errors — log them, never expose internals to the client
  logger.error({ err }, "Unhandled server error");

  return res
    .status(500)
    .json(errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred"));
});
