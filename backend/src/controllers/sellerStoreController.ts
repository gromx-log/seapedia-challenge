import { Request, Response } from "express";
import { SellerService } from "../services/sellerService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { z } from "zod";

const storeSchema = z.object({
  name: z.string().min(3).max(100),
});

export class SellerStoreController {
  static async get(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const store = await SellerService.getStore(authReq.user.userId);
      return res.status(200).json(store || null);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch store details" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const parsed = storeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid store name", details: parsed.error.format() });
      }

      const store = await SellerService.createStore(authReq.user.userId, parsed.data.name);
      return res.status(201).json(store);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create store" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const parsed = storeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid store name", details: parsed.error.format() });
      }

      const store = await SellerService.updateStore(authReq.user.userId, parsed.data.name);
      return res.status(200).json(store);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to update store" });
    }
  }
}
