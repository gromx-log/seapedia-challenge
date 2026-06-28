import prisma from "../config/prismaClient";

export class StoreService {
  static async getStoreDetail(id: string) {
    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        products: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!store) {
      throw new Error("Store not found");
    }

    return store;
  }
}
