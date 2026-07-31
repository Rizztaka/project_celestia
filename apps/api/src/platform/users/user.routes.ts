import { Router } from "express";
import { UserController } from "./user.controller.js";

const router = Router();
const userController = new UserController();

// Map endpoints to controller methods
router.post("/", userController.createUser);
router.get("/:id", userController.getUser);

export { router as userRoutes };
