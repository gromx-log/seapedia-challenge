import { Router } from "express";
import { BuyerAddressController } from "../controllers/buyerAddressController";
import { requireAuth, requireRole } from "../middlewares/authMiddleware";

const router = Router();

router.use(requireAuth, requireRole("BUYER"));

router.get("/", BuyerAddressController.list);
router.post("/", BuyerAddressController.create);
router.patch("/:id", BuyerAddressController.update);
router.delete("/:id", BuyerAddressController.delete);

export default router;
