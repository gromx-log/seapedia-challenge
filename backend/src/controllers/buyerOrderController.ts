import { Request, Response } from "express";
import { BuyerService } from "../services/buyerService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export class BuyerOrderController {
  static async list(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const orders = await BuyerService.listBuyerOrders(authReq.user.userId);
      return res.status(200).json(orders);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to list orders" });
    }
  }

  static async getDetail(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const parsed = paramsSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid order ID format" });
      }

      const order = await BuyerService.getOrderDetail(authReq.user.userId, parsed.data.id);
      return res.status(200).json(order);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || "Order not found" });
    }
  }
}
