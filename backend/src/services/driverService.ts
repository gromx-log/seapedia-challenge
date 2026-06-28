import prisma from "../config/prismaClient";
import { Prisma } from "@prisma/client";
import { getNow } from "../utils/systemClock";

export class DriverService {
  static async listAvailableJobs() {
    return prisma.deliveryJob.findMany({
      where: {
        status: "AVAILABLE",
      },
      include: {
        order: {
          include: {
            store: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getJobDetail(jobId: string) {
    const job = await prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: {
        order: {
          include: {
            store: { select: { name: true } },
            items: true,
          },
        },
        driver: { select: { id: true, username: true } },
      },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    return job;
  }

  static async takeJob(driverId: string, jobId: string) {
    const now = await getNow();

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Find the job to ensure it exists
      const job = await tx.deliveryJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error("Job not found");
      }

      if (job.status !== "AVAILABLE") {
        const error = new Error("Job has already been taken or is unavailable");
        (error as any).status = 409;
        throw error;
      }

      // Atomic update using updateMany with condition status == AVAILABLE
      const affected = await tx.deliveryJob.updateMany({
        where: {
          id: jobId,
          status: "AVAILABLE",
        },
        data: {
          driverId,
          status: "TAKEN",
          takenAt: now,
        },
      });

      if (affected.count === 0) {
        const error = new Error("Another driver has already taken this job");
        (error as any).status = 409;
        throw error;
      }

      // Update parent Order status to SEDANG_DIKIRIM
      await tx.order.update({
        where: { id: job.orderId },
        data: { status: "SEDANG_DIKIRIM" },
      });

      // Insert OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId: job.orderId,
          status: "SEDANG_DIKIRIM",
          note: "Order picked up by courier. Out for delivery.",
          changedAt: now,
        },
      });

      return tx.deliveryJob.findUnique({
        where: { id: jobId },
        include: { order: true },
      });
    });
  }

  static async completeJob(driverId: string, jobId: string) {
    const now = await getNow();

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const job = await tx.deliveryJob.findUnique({
        where: { id: jobId },
        include: { order: true },
      });

      if (!job) {
        throw new Error("Job not found");
      }

      if (job.status !== "TAKEN") {
        throw new Error(`Cannot complete job. Active status is ${job.status}, but it must be TAKEN.`);
      }

      if (job.driverId !== driverId) {
        const error = new Error("You do not own this job");
        (error as any).status = 403;
        throw error;
      }

      const earningAmount = Math.round(job.order.deliveryFee * 0.8);

      const updatedJob = await tx.deliveryJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          completedAt: now,
          earningAmount,
        },
      });

      // Update parent Order status to PESANAN_SELESAI
      await tx.order.update({
        where: { id: job.orderId },
        data: { status: "PESANAN_SELESAI" },
      });

      // Insert OrderStatusHistory
      await tx.orderStatusHistory.create({
        data: {
          orderId: job.orderId,
          status: "PESANAN_SELESAI",
          note: "Order delivered successfully.",
          changedAt: now,
        },
      });

      return updatedJob;
    });
  }

  static async getDriverHistory(driverId: string) {
    return prisma.deliveryJob.findMany({
      where: {
        driverId,
      },
      include: {
        order: {
          include: {
            store: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getDriverEarnings(driverId: string) {
    const completedJobs = await prisma.deliveryJob.findMany({
      where: {
        driverId,
        status: "COMPLETED",
      },
      select: {
        earningAmount: true,
      },
    });

    const totalEarnings = completedJobs.reduce((sum: number, job: (typeof completedJobs)[number]) => sum + (job.earningAmount || 0), 0);

    return {
      totalEarnings,
      completedCount: completedJobs.length,
    };
  }
}
