import { Request, Response } from "express";
import { AdminService } from "../services/adminService";
import { z } from "zod";

const advanceClockSchema = z.object({
  days: z.number().int().positive(),
});

export class AdminSystemClockController {
  static async get(req: Request, res: Response) {
    try {
      const clock = await AdminService.getSystemClock();
      return res.status(200).json(clock);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch system clock details" });
    }
  }

  static async advance(req: Request, res: Response) {
    try {
      const parsed = advanceClockSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Days to advance must be a positive integer" });
      }

      const result = await AdminService.advanceClock(parsed.data.days);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to advance system clock" });
    }
  }
}
