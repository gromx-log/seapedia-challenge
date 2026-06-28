import { Request, Response } from "express";
import { DriverService } from "../services/driverService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { z } from "zod";

const takeJobSchema = z.object({
  id: z.string().uuid(),
});

export class DriverJobController {
  static async listAvailable(req: Request, res: Response) {
    try {
      const jobs = await DriverService.listAvailableJobs();
      return res.status(200).json(jobs);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to retrieve available jobs" });
    }
  }

  static async detail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const job = await DriverService.getJobDetail(id);
      return res.status(200).json(job);
    } catch (error: any) {
      return res.status(error.message === "Job not found" ? 404 : 500).json({ error: error.message });
    }
  }

  static async take(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const driverId = authReq.user?.userId;
      if (!driverId) return res.status(401).json({ error: "Unauthorized" });

      const parsed = takeJobSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid job ID format" });
      }

      const job = await DriverService.takeJob(driverId, parsed.data.id);
      return res.status(200).json({ message: "Job successfully accepted", job });
    } catch (error: any) {
      const status = error.status || 400;
      return res.status(status).json({ error: error.message || "Failed to accept job" });
    }
  }

  static async complete(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const driverId = authReq.user?.userId;
      if (!driverId) return res.status(401).json({ error: "Unauthorized" });

      const parsed = takeJobSchema.safeParse(req.params);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid job ID format" });
      }

      const job = await DriverService.completeJob(driverId, parsed.data.id);
      return res.status(200).json({ message: "Job marked as completed", job });
    } catch (error: any) {
      const status = error.status || 400;
      return res.status(status).json({ error: error.message || "Failed to complete job" });
    }
  }

  static async history(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const driverId = authReq.user?.userId;
      if (!driverId) return res.status(401).json({ error: "Unauthorized" });

      const history = await DriverService.getDriverHistory(driverId);
      return res.status(200).json(history);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch driver job history" });
    }
  }

  static async earnings(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const driverId = authReq.user?.userId;
      if (!driverId) return res.status(401).json({ error: "Unauthorized" });

      const earnings = await DriverService.getDriverEarnings(driverId);
      return res.status(200).json(earnings);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch driver earnings" });
    }
  }
}
