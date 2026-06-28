import { Router } from "express";
import { AdminMonitoringController } from "../controllers/adminMonitoringController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth);
router.use(requireRole("ADMIN"));

router.get("/users", AdminMonitoringController.getUsers);
router.get("/stores", AdminMonitoringController.getStores);
router.get("/products", AdminMonitoringController.getProducts);
router.get("/orders", AdminMonitoringController.getOrders);
router.get("/delivery-jobs", AdminMonitoringController.getDeliveryJobs);
router.get("/overdue-orders", AdminMonitoringController.getOverdueOrders);

export default router;
