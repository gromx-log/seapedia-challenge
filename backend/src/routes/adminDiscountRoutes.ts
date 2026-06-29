import { Router } from "express";
import { AdminDiscountController } from "../controllers/adminDiscountController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.post("/vouchers", AdminDiscountController.createVoucher);
router.get("/vouchers", AdminDiscountController.listVouchers);
router.get("/vouchers/:id", AdminDiscountController.getVoucherById);
router.delete("/vouchers/:id", AdminDiscountController.deleteVoucher);
router.post("/promos", AdminDiscountController.createPromo);
router.get("/promos", AdminDiscountController.listPromos);
router.get("/promos/:id", AdminDiscountController.getPromoById);
router.delete("/promos/:id", AdminDiscountController.deletePromo);

export default router;
