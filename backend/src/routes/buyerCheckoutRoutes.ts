import { Router } from "express";
import { BuyerCheckoutController } from "../controllers/buyerCheckoutController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth, requireRole("BUYER"));

router.post("/", BuyerCheckoutController.process);

export default router;
