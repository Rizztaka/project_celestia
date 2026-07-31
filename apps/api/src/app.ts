import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import cors from "cors";
import { logger } from "@/core/logger/logger.js";
import { ZodError } from "zod";
import { userRoutes } from "./platform/users/user.routes.js";

export const app = express();

// Security and Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request Logging
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, "Incoming request");
  next();
});

// API Versioning and Domain Routing
const v1Router = express.Router();
v1Router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1", v1Router);
app.use("/api/v1/users", userRoutes);

// Global Error Handler Middleware
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: err.errors[0]?.message || "Validation failed",
      },
    });
  }

  if (err instanceof Error) {
    return res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: err.message,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
});
