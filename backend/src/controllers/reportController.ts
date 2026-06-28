import { Request, Response } from "express";
import { ReportService } from "../services/reportService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export class ReportController {
  static async getBuyerSpending(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const report = await ReportService.getBuyerSpending(authReq.user.userId);
      return res.status(200).json(report);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch spending report" });
    }
  }

  static async getSellerIncome(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const report = await ReportService.getSellerIncome(authReq.user.userId);
      return res.status(200).json(report);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch income report" });
    }
  }
}
