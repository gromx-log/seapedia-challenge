import { Request, Response } from "express";
import { BuyerService } from "../services/buyerService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { z } from "zod";

const checkoutSchema = z.object({
  deliveryMethod: z.enum(["INSTANT", "NEXT_DAY", "REGULAR"]).optional(),
  storeDeliveries: z.array(
    z.object({
      storeId: z.string(),
      deliveryMethod: z.enum(["INSTANT", "NEXT_DAY", "REGULAR"]),
    })
  ).optional(),
  discountCode: z.string().optional(),
});

export class BuyerCheckoutController {
  static async process(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const parsed = checkoutSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid delivery method or discount code selection" });
      }

      const orders = await BuyerService.checkout(authReq.user.userId, parsed.data);
      const primaryOrder = orders[0];
      return res.status(201).json({
        id: primaryOrder.id,
        ids: orders.map((o) => o.id),
        orders,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Checkout failed" });
    }
  }
}
