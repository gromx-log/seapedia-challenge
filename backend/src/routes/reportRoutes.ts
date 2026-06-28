import { Router } from "express";
import { ReportController } from "../controllers/reportController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.get("/buyer/reports/spending", requireAuth, requireRole("BUYER"), ReportController.getBuyerSpending);
router.get("/seller/reports/income", requireAuth, requireRole("SELLER"), ReportController.getSellerIncome);

export default router;
