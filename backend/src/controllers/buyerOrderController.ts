import { Request, Response } from "express";
import { BuyerService } from "../services/buyerService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

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

      const { id } = req.params;
      const order = await BuyerService.getOrderDetail(authReq.user.userId, id);
      return res.status(200).json(order);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || "Order not found" });
    }
  }
}
