import { Router } from "express";
import { AdminDiscountController } from "../controllers/adminDiscountController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.post("/vouchers", AdminDiscountController.createVoucher);
router.get("/vouchers", AdminDiscountController.listVouchers);
router.post("/promos", AdminDiscountController.createPromo);
router.get("/promos", AdminDiscountController.listPromos);

export default router;
