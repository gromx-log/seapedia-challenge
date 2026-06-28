import { Request, Response } from "express";
import { SellerService } from "../services/sellerService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export class SellerOrderController {
  static async list(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const orders = await SellerService.listStoreOrders(authReq.user.userId);
      return res.status(200).json(orders);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to list orders" });
    }
  }

  static async process(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const parsed = paramsSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid order ID format" });
      }

      const order = await SellerService.processOrder(authReq.user.userId, parsed.data.id);
      return res.status(200).json(order);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to process order" });
    }
  }
}
