import { Request, Response } from "express";
import prisma from "../config/prismaClient";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { z } from "zod";
import { getNow } from "../utils/systemClock";

const validateDiscountSchema = z.object({
  code: z.string().min(1),
});

export class BuyerDiscountController {
  static async validate(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const parsed = validateDiscountSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Code is required" });
      }

      const cleanCode = parsed.data.code.trim().toUpperCase();
      const now = await getNow();

      // 1. Check Voucher table first
      const voucher = await prisma.voucher.findUnique({
        where: { code: cleanCode },
      });

      if (voucher) {
        if (voucher.expiresAt < now) {
          return res.status(400).json({ isValid: false, error: "Voucher has expired" });
        }
        if (voucher.usageCount >= voucher.usageLimit) {
          return res.status(400).json({ isValid: false, error: "Voucher usage limit reached" });
        }

        return res.status(200).json({
          isValid: true,
          type: "VOUCHER",
          discountKind: voucher.discountKind,
          value: voucher.value,
        });
      }

      // 2. Check Promo table
      const promo = await prisma.promo.findUnique({
        where: { code: cleanCode },
      });

      if (promo) {
        if (promo.expiresAt < now) {
          return res.status(400).json({ isValid: false, error: "Promo has expired" });
        }

        return res.status(200).json({
          isValid: true,
          type: "PROMO",
          discountKind: promo.discountKind,
          value: promo.value,
        });
      }

      return res.status(404).json({ isValid: false, error: "Invalid discount code" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to validate code" });
    }
  }
}
