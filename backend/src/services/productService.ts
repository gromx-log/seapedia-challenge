import prisma from "../config/prismaClient";

export class ProductService {
  static async listActiveProducts() {
    return prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getProductDetail(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  }
}
