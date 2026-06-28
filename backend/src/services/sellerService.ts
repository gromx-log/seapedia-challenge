import prisma from "../config/prismaClient";

export class SellerService {
  static async getStore(userId: string) {
    return prisma.store.findUnique({
      where: { ownerId: userId },
    });
  }

  static async createStore(userId: string, name: string) {
    if (!name || name.trim() === "") {
      throw new Error("Store name is required");
    }

    // Check if seller already has a store
    const existingStoreByOwner = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (existingStoreByOwner) {
      throw new Error("You already have a store. A seller can only own one store.");
    }

    // Check if store name is already taken
    const existingStoreByName = await prisma.store.findUnique({
      where: { name },
    });

    if (existingStoreByName) {
      throw new Error("Store name is already taken. Please choose another name.");
    }

    const store = await prisma.store.create({
      data: {
        name,
        ownerId: userId,
      },
    });

    return store;
  }

  static async updateStore(userId: string, name: string) {
    if (!name || name.trim() === "") {
      throw new Error("Store name is required");
    }

    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      throw new Error("Store not found. Please create a store first.");
    }

    // Check name uniqueness if changed
    if (store.name !== name) {
      const existing = await prisma.store.findUnique({
        where: { name },
      });
      if (existing) {
        throw new Error("Store name is already taken. Please choose another name.");
      }
    }

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: { name },
    });

    return updated;
  }

  static async listProducts(userId: string) {
    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      return []; // Return empty list if no store exists yet
    }

    return prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createProduct(
    userId: string,
    data: { name: string; price: number; stock: number; description?: string }
  ) {
    const { name, price, stock, description } = data;

    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      throw new Error("Store not found. Please set up your store before adding products.");
    }

    if (!name || name.trim() === "") {
      throw new Error("Product name is required");
    }

    if (price < 0) {
      throw new Error("Price cannot be negative");
    }

    if (stock < 0) {
      throw new Error("Stock cannot be negative");
    }

    const product = await prisma.product.create({
      data: {
        name,
        price,
        stock,
        description,
        storeId: store.id,
        isActive: true,
      },
    });

    return product;
  }

  static async updateProduct(
    userId: string,
    productId: string,
    data: { name?: string; price?: number; stock?: number; description?: string; isActive?: boolean }
  ) {
    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      throw new Error("Store not found");
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.storeId !== store.id) {
      throw new Error("Product not found or access denied");
    }

    if (data.price !== undefined && data.price < 0) {
      throw new Error("Price cannot be negative");
    }

    if (data.stock !== undefined && data.stock < 0) {
      throw new Error("Stock cannot be negative");
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data,
    });

    return updated;
  }

  static async deleteProduct(userId: string, productId: string) {
    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      throw new Error("Store not found");
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.storeId !== store.id) {
      throw new Error("Product not found or access denied");
    }

    // Check if the product has been ordered. If ordered, we should soft delete it by setting isActive: false,
    // to preserve order references. Otherwise, hard delete it.
    const hasOrderItems = await prisma.orderItem.findFirst({
      where: { productId },
    });

    if (hasOrderItems) {
      // Soft delete
      return prisma.product.update({
        where: { id: productId },
        data: { isActive: false },
      });
    }

    // Hard delete
    await prisma.cartItem.deleteMany({
      where: { productId },
    });

    return prisma.product.delete({
      where: { id: productId },
    });
  }

  static async listStoreOrders(userId: string) {
    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      return [];
    }

    return prisma.order.findMany({
      where: { storeId: store.id },
      include: {
        buyer: { select: { id: true, username: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async processOrder(userId: string, orderId: string) {
    const store = await prisma.store.findUnique({
      where: { ownerId: userId },
    });

    if (!store) {
      throw new Error("Store not found");
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        statusHistory: true,
      },
    });

    if (!order || order.storeId !== store.id) {
      throw new Error("Order not found or access denied");
    }

    if (order.status !== "SEDANG_DIKEMAS") {
      throw new Error(`Cannot process order. Active status is ${order.status}, but it must be SEDANG_DIKEMAS.`);
    }

    return prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: "MENUNGGU_PENGIRIM",
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: "MENUNGGU_PENGIRIM",
          note: "Order packaged by seller. Awaiting driver pickup.",
        },
      });

      return updatedOrder;
    });
  }
}
