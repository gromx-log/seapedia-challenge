import { Router } from "express";
import { DriverJobController } from "../controllers/driverJobController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// Apply auth & role check to all driver routes
router.use(requireAuth);
router.use(requireRole("DRIVER"));

router.get("/", DriverJobController.listAvailable);
router.get("/history", DriverJobController.history);
router.get("/earnings", DriverJobController.earnings);
router.get("/:id", DriverJobController.detail);
router.post("/:id/take", DriverJobController.take);
router.post("/:id/complete", DriverJobController.complete);

export default router;
