import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data (in order of dependencies)
  await prisma.review.deleteMany({});
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.walletTransaction.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.store.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.voucher.deleteMany({});
  await prisma.promo.deleteMany({});

  const saltRounds = 10;

  // 1. Create Admin (Exclusive, no role-picker)
  const adminPasswordHash = await bcrypt.hash("admin123", saltRounds);
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@seapedia.com",
      passwordHash: adminPasswordHash,
      roles: {
        create: {
          role: "ADMIN",
        },
      },
    },
  });
  console.log("Seeded Admin:", admin.username);

  // 2. Create Seller
  const sellerPasswordHash = await bcrypt.hash("seller123", saltRounds);
  const seller = await prisma.user.create({
    data: {
      username: "seller1",
      email: "seller1@seapedia.com",
      passwordHash: sellerPasswordHash,
      roles: {
        create: {
          role: "SELLER",
        },
      },
      store: {
        create: {
          name: "Toko Seapedia Demo",
        },
      },
    },
    include: {
      store: true,
    },
  });
  console.log("Seeded Seller:", seller.username);

  const storeId = seller.store?.id;
  if (!storeId) {
    throw new Error("Store creation failed for seller1");
  }

  // Seed products for Toko Seapedia Demo
  const productsData = [
    {
      name: "Sepatu Keren",
      price: 150000,
      stock: 10,
      description: "Sepatu olahraga yang keren dan nyaman dipakai.",
      isActive: true,
    },
    {
      name: "Kaos Polos",
      price: 50000,
      stock: 20,
      description: "Kaos polos bahan katun combed 30s, adem dan lembut.",
      isActive: true,
    },
    {
      name: "Tas Ransel",
      price: 250000,
      stock: 5,
      description: "Tas ransel tahan air cocok untuk sekolah, kuliah, dan laptop.",
      isActive: true,
    },
  ];

  for (const item of productsData) {
    await prisma.product.create({
      data: {
        ...item,
        storeId,
      },
    });
  }
  console.log("Seeded products for store: Toko Seapedia Demo");

  // 3. Create Buyer (with preloaded wallet Rp 500,000)
  const buyerPasswordHash = await bcrypt.hash("buyer123", saltRounds);
  const buyer = await prisma.user.create({
    data: {
      username: "buyer1",
      email: "buyer1@seapedia.com",
      passwordHash: buyerPasswordHash,
      roles: {
        create: {
          role: "BUYER",
        },
      },
      wallet: {
        create: {
          balance: 500000,
          transactions: {
            create: {
              type: "TOPUP",
              amount: 500000,
              note: "Pre-topped wallet balance for demo",
            },
          },
        },
      },
      cart: {
        create: {},
      },
    },
  });
  console.log("Seeded Buyer:", buyer.username);

  // 4. Seed Voucher & Promo
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

  const voucher = await prisma.voucher.create({
    data: {
      code: "SEAPEDIA10",
      discountKind: "PERCENT",
      value: 10,
      usageLimit: 100,
      usageCount: 0,
      expiresAt,
    },
  });
  console.log("Seeded Voucher:", voucher.code);

  const promo = await prisma.promo.create({
    data: {
      code: "WELCOME20K",
      discountKind: "FLAT",
      value: 20000,
      expiresAt,
    },
  });
  console.log("Seeded Promo:", promo.code);

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
