import express from "express";
import helmet from "helmet";
import cors from "cors";
import { logger } from "@/core/logger/logger.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, "Incoming request");
  next();
});

const v1Router = express.Router();

v1Router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: { status: "online", timestamp: new Date().toISOString() },
    message: "Project Celestia API is healthy",
  });
});

app.use("/api/v1", v1Router);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested route does not exist.",
    },
  });
});
