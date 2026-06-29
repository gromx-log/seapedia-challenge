import prisma from "../config/prismaClient";
import { Prisma } from "@prisma/client";
import { getNow } from "../utils/systemClock";
import { getSlaDuration } from "../utils/sla";

export class AdminService {
  static async createVoucher(data: {
    code: string;
    discountKind: "PERCENT" | "FLAT";
    value: number;
    usageLimit: number;
    expiresAt: string;
  }) {
    const { code, discountKind, value, usageLimit, expiresAt } = data;
    const cleanCode = code.trim().toUpperCase();

    // Check uniqueness across Vouchers & Promos
    const existingVoucher = await prisma.voucher.findUnique({ where: { code: cleanCode } });
    const existingPromo = await prisma.promo.findUnique({ where: { code: cleanCode } });

    if (existingVoucher || existingPromo) {
      throw new Error("Discount code already exists");
    }

    return prisma.voucher.create({
      data: {
        code: cleanCode,
        discountKind,
        value,
        usageLimit,
        expiresAt: new Date(expiresAt),
      },
    });
  }

  static async listVouchers() {
    return prisma.voucher.findMany({
      orderBy: { expiresAt: "desc" },
    });
  }

  static async getVoucherById(id: string) {
    const voucher = await prisma.voucher.findUnique({ where: { id } });
    if (!voucher) throw new Error("Voucher not found");
    return voucher;
  }

  static async createPromo(data: {
    code: string;
    discountKind: "PERCENT" | "FLAT";
    value: number;
    expiresAt: string;
  }) {
    const { code, discountKind, value, expiresAt } = data;
    const cleanCode = code.trim().toUpperCase();

    const existingVoucher = await prisma.voucher.findUnique({ where: { code: cleanCode } });
    const existingPromo = await prisma.promo.findUnique({ where: { code: cleanCode } });

    if (existingVoucher || existingPromo) {
      throw new Error("Discount code already exists");
    }

    return prisma.promo.create({
      data: {
        code: cleanCode,
        discountKind,
        value,
        expiresAt: new Date(expiresAt),
      },
    });
  }

  static async listPromos() {
    return prisma.promo.findMany({
      orderBy: { expiresAt: "desc" },
    });
  }

  static async getPromoById(id: string) {
    const promo = await prisma.promo.findUnique({ where: { id } });
    if (!promo) throw new Error("Promo not found");
    return promo;
  }

  static async deleteVoucher(id: string) {
    const voucher = await prisma.voucher.findUnique({ where: { id } });
    if (!voucher) throw new Error("Voucher not found");
    return prisma.voucher.delete({ where: { id } });
  }

  static async deletePromo(id: string) {
    const promo = await prisma.promo.findUnique({ where: { id } });
    if (!promo) throw new Error("Promo not found");
    return prisma.promo.delete({ where: { id } });
  }

  // ==========================================
  // MONITORING ENDPOINTS
  // ==========================================
  static async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        roles: { select: { role: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getStores() {
    return prisma.store.findMany({
      include: {
        owner: { select: { username: true } },
        products: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getProducts() {
    return prisma.product.findMany({
      include: {
        store: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getOrders() {
    return prisma.order.findMany({
      include: {
        buyer: { select: { username: true } },
        store: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getDeliveryJobs() {
    return prisma.deliveryJob.findMany({
      include: {
        order: { select: { total: true, deliveryMethod: true, store: { select: { name: true } } } },
        driver: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getOverdueOrders() {
    const now = await getNow();
    const activeOrders = await prisma.order.findMany({
      where: {
        status: { notIn: ["PESANAN_SELESAI", "DIKEMBALIKAN"] },
      },
      include: {
        buyer: { select: { username: true } },
        store: { select: { name: true } },
      },
    });

    const overdue = activeOrders.filter((order: (typeof activeOrders)[number]) => {
      const elapsed = now.getTime() - order.createdAt.getTime();
      return elapsed > getSlaDuration(order.deliveryMethod);
    });

    const history = await prisma.order.findMany({
      where: {
        status: "DIKEMBALIKAN",
      },
      include: {
        buyer: { select: { username: true } },
        store: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      overdue: overdue.map((o: (typeof overdue)[number]) => ({
        id: o.id,
        buyerName: o.buyer.username,
        storeName: o.store.name,
        deliveryMethod: o.deliveryMethod,
        total: o.total,
        createdAt: o.createdAt,
        status: o.status,
      })),
      history: history.map((o: (typeof history)[number]) => ({
        id: o.id,
        buyerName: o.buyer.username,
        storeName: o.store.name,
        deliveryMethod: o.deliveryMethod,
        total: o.total,
        createdAt: o.createdAt,
        status: o.status,
      })),
    };
  }

  // ==========================================
  // SIMULATED SYSTEM CLOCK & SLA SWEEP
  // ==========================================
  static async getSystemClock() {
    let clock = await prisma.systemClock.findUnique({ where: { id: 1 } });
    if (!clock) {
      clock = await prisma.systemClock.create({ data: { id: 1, offsetMs: 0n } });
    }
    const offsetMsNum = Number(clock.offsetMs);
    const simulatedTime = new Date(Date.now() + offsetMsNum);
    return {
      offsetMs: offsetMsNum,
      simulatedTime,
    };
  }

  static async advanceClock(days: number) {
    if (days <= 0) {
      throw new Error("Days to advance must be positive");
    }

    const msToAdvance = BigInt(days * 24 * 60 * 60 * 1000);

    // Update offsetMs
    const clock = await prisma.systemClock.upsert({
      where: { id: 1 },
      update: { offsetMs: { increment: msToAdvance } },
      create: { id: 1, offsetMs: msToAdvance },
    });

    const offsetMsNum = Number(clock.offsetMs);
    const simulatedNow = new Date(Date.now() + offsetMsNum);

    // Run SLA Overdue Sweep
    const activeOrders = await prisma.order.findMany({
      where: {
        status: { notIn: ["PESANAN_SELESAI", "DIKEMBALIKAN"] },
      },
      include: {
        items: true,
        buyer: { include: { wallet: true } },
      },
    });

    const overdueOrders = activeOrders.filter((order: (typeof activeOrders)[number]) => {
      const elapsed = simulatedNow.getTime() - order.createdAt.getTime();
      return elapsed > getSlaDuration(order.deliveryMethod);
    });

    const processedOrders: string[] = [];

    for (const order of overdueOrders) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Double check status to avoid double processing in concurrency
        const freshOrder = await tx.order.findUnique({
          where: { id: order.id },
        });

        if (!freshOrder || freshOrder.status === "PESANAN_SELESAI" || freshOrder.status === "DIKEMBALIKAN") {
          return;
        }

        // 1. Move Order status to DIKEMBALIKAN
        await tx.order.update({
          where: { id: order.id },
          data: { status: "DIKEMBALIKAN" },
        });

        // 2. Add Status History
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: "DIKEMBALIKAN",
            note: `Auto-returned: exceeded ${order.deliveryMethod} SLA`,
            changedAt: simulatedNow,
          },
        });

        // 3. Refund wallet
        const wallet = await tx.wallet.findUnique({
          where: { userId: order.buyerId },
        });

        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: order.total } },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "REFUND",
              amount: order.total,
              note: `Auto-refund: Order ${order.id.substring(0, 8)}... exceeded SLA`,
              createdAt: simulatedNow,
            },
          });
        }

        // 4. Restore product stocks
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // 5. Cancel DeliveryJob if exists and not completed
        const job = await tx.deliveryJob.findUnique({
          where: { orderId: order.id },
        });

        if (job && job.status !== "COMPLETED") {
          await tx.deliveryJob.update({
            where: { id: job.id },
            data: { status: "CANCELLED" },
          });
        }

        processedOrders.push(order.id);
      });
    }

    return {
      advancedDays: days,
      simulatedTime: simulatedNow,
      sweptOrdersCount: processedOrders.length,
      sweptOrderIds: processedOrders,
    };
  }
}
