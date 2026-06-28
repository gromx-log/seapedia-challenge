import { Request, Response } from "express";
import { ReviewService } from "../services/reviewService";
import { z } from "zod";

const reviewSchema = z.object({
  reviewerName: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

export class ReviewController {
  static async list(req: Request, res: Response) {
    try {
      const reviews = await ReviewService.listReviews();
      return res.status(200).json(reviews);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to retrieve reviews" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const parsed = reviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid review data", details: parsed.error.format() });
      }

      const review = await ReviewService.createReview(parsed.data);
      return res.status(201).json(review);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to submit review" });
    }
  }
}
