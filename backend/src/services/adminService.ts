import prisma from "../config/prismaClient";

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
}
