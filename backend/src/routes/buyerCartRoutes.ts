import { Router } from "express";
import { BuyerCartController } from "../controllers/buyerCartController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth, requireRole("BUYER"));

router.get("/", BuyerCartController.get);
router.post("/items", BuyerCartController.addItem);
router.patch("/items/:id", BuyerCartController.updateItem);
router.delete("/items/:id", BuyerCartController.removeItem);
router.delete("/", BuyerCartController.clear);

export default router;
