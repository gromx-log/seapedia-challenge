import { Router } from "express";
import { ProductController } from "../controllers/productController";

const router = Router();

router.get("/", ProductController.list);
router.get("/:id", ProductController.getDetail);

export default router;
