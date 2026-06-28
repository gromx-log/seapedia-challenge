import { Request, Response } from "express";
import { BuyerService } from "../services/buyerService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { z } from "zod";

const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const updateItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export class BuyerCartController {
  static async get(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const cart = await BuyerService.getCart(authReq.user.userId);
      return res.status(200).json(cart);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch cart details" });
    }
  }

  static async addItem(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const parsed = cartItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid product ID or quantity" });
      }

      const item = await BuyerService.addItemToCart(
        authReq.user.userId,
        parsed.data.productId,
        parsed.data.quantity
      );
      return res.status(201).json(item);
    } catch (error: any) {
      // Return 409 Conflict for single-store constraint violation
      if (error.message.includes("locked to")) {
        return res.status(409).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message || "Failed to add item to cart" });
    }
  }

  static async updateItem(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const parsed = updateItemSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid quantity" });
      }

      const item = await BuyerService.updateCartItem(authReq.user.userId, id, parsed.data.quantity);
      return res.status(200).json(item);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to update item" });
    }
  }

  static async removeItem(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      await BuyerService.removeCartItem(authReq.user.userId, id);
      return res.status(200).json({ message: "Item removed from cart" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to remove item" });
    }
  }

  static async clear(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      await BuyerService.clearCart(authReq.user.userId);
      return res.status(200).json({ message: "Cart cleared" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to clear cart" });
    }
  }
}
