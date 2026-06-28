import { Router } from "express";
import { SellerProductController } from "../controllers/sellerProductController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// Apply authorization and active role check
router.use(requireAuth, requireRole("SELLER"));

router.get("/", SellerProductController.list);
router.post("/", SellerProductController.create);
router.patch("/:id", SellerProductController.update);
router.delete("/:id", SellerProductController.delete);

export default router;
