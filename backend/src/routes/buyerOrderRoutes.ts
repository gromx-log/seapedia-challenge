import { Router } from "express";
import { BuyerOrderController } from "../controllers/buyerOrderController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth, requireRole("BUYER"));

router.get("/", BuyerOrderController.list);
router.get("/:id", BuyerOrderController.getDetail);

export default router;
