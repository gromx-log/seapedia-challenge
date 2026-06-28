import prisma from "../config/prismaClient";
import { sanitizeHTML } from "../utils/sanitize";

export class ReviewService {
  static async createReview(data: { reviewerName: string; rating: number; comment: string }) {
    const { reviewerName, rating, comment } = data;

    if (!reviewerName || reviewerName.trim() === "") {
      throw new Error("Reviewer name is required");
    }

    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    if (!comment || comment.trim() === "") {
      throw new Error("Comment is required");
    }

    // Sanitize comment before database storage (escapes HTML tags)
    const sanitizedComment = sanitizeHTML(comment);
    const sanitizedName = sanitizeHTML(reviewerName);

    const review = await prisma.review.create({
      data: {
        reviewerName: sanitizedName,
        rating,
        comment: sanitizedComment,
      },
    });

    return review;
  }

  static async listReviews() {
    const reviews = await prisma.review.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Re-sanitize on output to ensure double-layer XSS protection
    return reviews.map((r) => ({
      ...r,
      reviewerName: sanitizeHTML(r.reviewerName),
      comment: sanitizeHTML(r.comment),
    }));
  }
}
