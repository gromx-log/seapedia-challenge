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

  static async getVoucherById(req: Request, res: Response) {
    try {
      const voucher = await AdminService.getVoucherById(req.params.id);
      return res.status(200).json(voucher);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || "Voucher not found" });
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

  static async getPromoById(req: Request, res: Response) {
    try {
      const promo = await AdminService.getPromoById(req.params.id);
      return res.status(200).json(promo);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || "Promo not found" });
    }
  }

  static async deleteVoucher(req: Request, res: Response) {
    try {
      const voucher = await AdminService.deleteVoucher(req.params.id);
      return res.status(200).json({ message: "Voucher deleted successfully", voucher });
    } catch (error: any) {
      const status = error.message === "Voucher not found" ? 404 : 400;
      return res.status(status).json({ error: error.message || "Failed to delete voucher" });
    }
  }

  static async deletePromo(req: Request, res: Response) {
    try {
      const promo = await AdminService.deletePromo(req.params.id);
      return res.status(200).json({ message: "Promo deleted successfully", promo });
    } catch (error: any) {
      const status = error.message === "Promo not found" ? 404 : 400;
      return res.status(status).json({ error: error.message || "Failed to delete promo" });
    }
  }
}
