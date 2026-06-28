import prisma from "../config/prismaClient";

export class ReportService {
  static async getBuyerSpending(buyerId: string) {
        const orders = await prisma.order.findMany({
      where: {
        buyerId,
        status: { not: "DIKEMBALIKAN" },
      },
      include: {
        store: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    let totalSpent = 0;
    let totalDiscountSaved = 0;
    let totalDeliveryFee = 0;
    let totalPpn = 0;

    const monthlyBreakdownMap: { [key: string]: number } = {};

    for (const order of orders) {
      totalSpent += order.total;
      totalDiscountSaved += order.discountAmount;
      totalDeliveryFee += order.deliveryFee;
      totalPpn += order.ppn;

      // Group by Month (e.g., "Jun 2026")
      const date = new Date(order.createdAt);
      const monthKey = date.toLocaleString("en-US", { month: "short", year: "numeric" });
      monthlyBreakdownMap[monthKey] = (monthlyBreakdownMap[monthKey] || 0) + order.total;
    }

    const monthlyBreakdown = Object.keys(monthlyBreakdownMap).map((month) => ({
      month,
      amount: monthlyBreakdownMap[month],
    }));

    return {
      totalSpent,
      totalDiscountSaved,
      totalDeliveryFee,
      totalPpn,
      ordersCount: orders.length,
      monthlyBreakdown,
      orders: orders.map((o: any) => ({
        id: o.id,
        storeName: o.store.name,
        subtotal: o.subtotal,
        discountAmount: o.discountAmount,
        deliveryFee: o.deliveryFee,
        ppn: o.ppn,
        total: o.total,
        createdAt: o.createdAt,
        status: o.status,
      })),
    };
  }

  static async getSellerIncome(userId: string) {
    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      throw new Error("Store not found");
    }

    const orders = await prisma.order.findMany({
      where: {
        storeId: store.id,
        status: { not: "DIKEMBALIKAN" },
      },
      include: {
        buyer: { select: { username: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    let totalIncome = 0;
    let totalDiscountGiven = 0;
    let totalDeliveryFee = 0; // note: delivery fee is not income for seller, but good to know
    let totalPpn = 0;

    const monthlyBreakdownMap: { [key: string]: number } = {};

    for (const order of orders) {
      // Seller actual income is subtotal - discountAmount (post-discount subtotal)
      // Since Delivery fee and PPN are paid to courier / tax agency, they don't count towards store gross product sales
      // Let's count store gross product sales: order.subtotal - order.discountAmount
      const netProductSales = order.subtotal - order.discountAmount;
      totalIncome += netProductSales;
      totalDiscountGiven += order.discountAmount;
      totalDeliveryFee += order.deliveryFee;
      totalPpn += order.ppn;

      const date = new Date(order.createdAt);
      const monthKey = date.toLocaleString("en-US", { month: "short", year: "numeric" });
      monthlyBreakdownMap[monthKey] = (monthlyBreakdownMap[monthKey] || 0) + netProductSales;
    }

    const monthlyBreakdown = Object.keys(monthlyBreakdownMap).map((month) => ({
      month,
      amount: monthlyBreakdownMap[month],
    }));

    return {
      totalIncome,
      totalDiscountGiven,
      totalDeliveryFee,
      totalPpn,
      ordersCount: orders.length,
      monthlyBreakdown,
      orders: orders.map((o: any) => ({
        id: o.id,
        buyerName: o.buyer.username,
        subtotal: o.subtotal,
        discountAmount: o.discountAmount,
        total: o.total,
        createdAt: o.createdAt,
        status: o.status,
      })),
    };
  }
}
