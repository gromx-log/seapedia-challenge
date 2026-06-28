import { Request, Response } from "express";
import { AdminService } from "../services/adminService";
import { z } from "zod";

const voucherSchema = z.object({
  code: z.string().min(2).max(50),
  discountKind: z.enum(["PERCENT", "FLAT"]),
  value: z.number().int().positive(),
  usageLimit: z.number().int().positive(),
  expiresAt: z.string().datetime(),
});

const promoSchema = z.object({
  code: z.string().min(2).max(50),
  discountKind: z.enum(["PERCENT", "FLAT"]),
  value: z.number().int().positive(),
  expiresAt: z.string().datetime(),
});

export class AdminDiscountController {
  static async createVoucher(req: Request, res: Response) {
    try {
      const parsed = voucherSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid voucher data", details: parsed.error.format() });
      }

      const voucher = await AdminService.createVoucher(parsed.data);
      return res.status(201).json(voucher);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create voucher" });
    }
  }

  static async listVouchers(req: Request, res: Response) {
    try {
      const vouchers = await AdminService.listVouchers();
      return res.status(200).json(vouchers);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to list vouchers" });
    }
  }

  static async createPromo(req: Request, res: Response) {
    try {
      const parsed = promoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid promo data", details: parsed.error.format() });
      }

      const promo = await AdminService.createPromo(parsed.data);
      return res.status(201).json(promo);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create promo" });
    }
  }

  static async listPromos(req: Request, res: Response) {
    try {
      const promos = await AdminService.listPromos();
      return res.status(200).json(promos);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to list promos" });
    }
  }
}
