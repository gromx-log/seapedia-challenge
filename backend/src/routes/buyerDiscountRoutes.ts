import { Router } from "express";
import { BuyerDiscountController } from "../controllers/buyerDiscountController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth, requireRole("BUYER"));

router.post("/validate", BuyerDiscountController.validate);

export default router;
