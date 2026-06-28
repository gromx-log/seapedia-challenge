import { Router } from "express";
import { BuyerWalletController } from "../controllers/buyerWalletController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth, requireRole("BUYER"));

router.get("/", BuyerWalletController.get);
router.post("/topup", BuyerWalletController.topup);
router.get("/transactions", BuyerWalletController.transactions);

export default router;
