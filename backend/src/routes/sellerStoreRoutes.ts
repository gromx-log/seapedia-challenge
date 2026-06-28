import { Router } from "express";
import { SellerStoreController } from "../controllers/sellerStoreController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// Apply authorization and active role check
router.use(requireAuth, requireRole("SELLER"));

router.get("/", SellerStoreController.get);
router.post("/", SellerStoreController.create);
router.patch("/", SellerStoreController.update);

export default router;
