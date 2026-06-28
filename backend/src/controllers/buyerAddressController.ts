import { Request, Response } from "express";
import { BuyerService } from "../services/buyerService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { z } from "zod";

const createAddressSchema = z.object({
  label: z.string().optional(),
  recipientName: z.string().min(2).max(100),
  phone: z.string().min(5).max(20),
  fullAddress: z.string().min(5).max(500),
  isDefault: z.boolean().default(false),
});

const updateAddressSchema = z.object({
  label: z.string().optional(),
  recipientName: z.string().min(2).max(100).optional(),
  phone: z.string().min(5).max(20).optional(),
  fullAddress: z.string().min(5).max(500).optional(),
  isDefault: z.boolean().optional(),
});

export class BuyerAddressController {
  static async list(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const addresses = await BuyerService.listAddresses(authReq.user.userId);
      return res.status(200).json(addresses);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to list addresses" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const parsed = createAddressSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid address data", details: parsed.error.format() });
      }

      const address = await BuyerService.createAddress(authReq.user.userId, parsed.data);
      return res.status(201).json(address);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create address" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const parsed = updateAddressSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid address data", details: parsed.error.format() });
      }

      const address = await BuyerService.updateAddress(authReq.user.userId, id, parsed.data);
      return res.status(200).json(address);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to update address" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      await BuyerService.deleteAddress(authReq.user.userId, id);
      return res.status(200).json({ message: "Address deleted successfully" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to delete address" });
    }
  }
}
