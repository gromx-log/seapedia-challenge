import { Router } from "express";
import { SellerOrderController } from "../controllers/sellerOrderController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth, requireRole("SELLER"));

router.get("/", SellerOrderController.list);
router.patch("/:id/process", SellerOrderController.process);

export default router;
