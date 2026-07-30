import pino from "pino";
import { env } from "@/core/config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  transport:
    env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});
