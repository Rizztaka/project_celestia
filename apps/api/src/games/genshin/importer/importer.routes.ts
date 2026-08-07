import { Router } from "express";
import { requireAuth } from "@/core/middleware/auth.middleware.js";
import { GenshinImportController } from "./importer.controller.js";

const router = Router();
const importController = new GenshinImportController();

/**
 * POST /import — Import a GOOD-format account export.
 *
 * Full path: POST /api/v1/games/genshin/import
 * Requires a valid JWT — userId is always taken from the verified token,
 * never from the request body, preventing cross-account data injection.
 */
router.post("/import", requireAuth, importController.importGenshinAccount);

export { router as importerRoutes };
