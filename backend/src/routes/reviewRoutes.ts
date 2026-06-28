import { Router } from "express";
import { ReviewController } from "../controllers/reviewController";

const router = Router();

router.get("/", ReviewController.list);
router.post("/", ReviewController.create);

export default router;
