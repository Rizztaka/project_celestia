import { app } from "@/app.js";
import { env } from "@/core/config/env.js";
import { logger } from "@/core/logger/logger.js";

const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  logger.info(
    `Project Celestia API is running on port ${PORT} in ${env.NODE_ENV} mode`,
  );
});
