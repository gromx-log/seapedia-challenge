import { Router } from "express";
import { StoreController } from "../controllers/storeController";

const router = Router();

router.get("/:id", StoreController.getDetail);

export default router;
