import { Request, Response } from "express";
import { BuyerService } from "../services/buyerService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { z } from "zod";

const topupSchema = z.object({
  amount: z.number().int().positive(),
});

export class BuyerWalletController {
  static async get(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const wallet = await BuyerService.getWallet(authReq.user.userId);
      return res.status(200).json(wallet);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch wallet details" });
    }
  }

  static async topup(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const parsed = topupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid top up amount" });
      }

      const wallet = await BuyerService.topupWallet(authReq.user.userId, parsed.data.amount);
      return res.status(200).json(wallet);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Top up failed" });
    }
  }

  static async transactions(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const txs = await BuyerService.listWalletTransactions(authReq.user.userId);
      return res.status(200).json(txs);
    } catch (error: any) {
      return res.status(550).json({ error: error.message || "Failed to list transactions" });
    }
  }
}
