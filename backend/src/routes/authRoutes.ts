import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { requireAuth } from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/select-role", AuthController.selectRole);
router.post("/logout", requireAuth, AuthController.logout);
router.post("/switch-role", requireAuth, AuthController.switchRole);
router.get("/me", requireAuth, AuthController.me);

export default router;
