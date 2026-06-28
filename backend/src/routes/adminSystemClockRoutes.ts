import { Router } from "express";
import { AdminSystemClockController } from "../controllers/adminSystemClockController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth);
router.use(requireRole("ADMIN"));

router.get("/", AdminSystemClockController.get);
router.post("/advance", AdminSystemClockController.advance);

export default router;
