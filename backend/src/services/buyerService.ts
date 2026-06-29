import prisma from "../config/prismaClient";
import { calculatePricing } from "../utils/pricing";
import { getNow } from "../utils/systemClock";
import { sanitizeHTML } from "../utils/sanitize";

export class BuyerService {
  // ==========================================
  // WALLET
  // ==========================================
  static async getWallet(userId: string) {
    return prisma.wallet.findUnique({
      where: { userId },
    });
  }

  static async topupWallet(userId: string, amount: number) {
    if (amount <= 0) {
      throw new Error("Top up amount must be positive");
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    return prisma.$transaction(async (tx) => {
      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
        },
      });

      // Create transaction record
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "TOPUP",
          amount,
          note: `Top up Rp ${amount.toLocaleString("id-ID")}`,
          createdAt: await getNow(),
        },
      });

      return updatedWallet;
    });
  }

  static async listWalletTransactions(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    return prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
    });
  }

  // ==========================================
  // SHIPPING ADDRESS
  // ==========================================
  static async listAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });
  }

  static async createAddress(
    userId: string,
    data: { label?: string; recipientName: string; phone: string; fullAddress: string; isDefault: boolean }
  ) {
    return prisma.$transaction(async (tx) => {
      // If setting as default, unset previous default
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // If this is the user's first address, force it to be default
      const count = await tx.address.count({ where: { userId } });
      const finalIsDefault = count === 0 ? true : data.isDefault;

      return tx.address.create({
        data: {
          ...data,
          label: data.label ? sanitizeHTML(data.label) : null,
          recipientName: sanitizeHTML(data.recipientName),
          phone: sanitizeHTML(data.phone),
          fullAddress: sanitizeHTML(data.fullAddress),
          isDefault: finalIsDefault,
          userId,
        },
      });
    });
  }

  static async updateAddress(
    userId: string,
    addressId: string,
    data: { label?: string; recipientName?: string; phone?: string; fullAddress?: string; isDefault?: boolean }
  ) {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      throw new Error("Address not found or access denied");
    }

    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const sanitizedData = { ...data };
      if (data.label !== undefined) sanitizedData.label = data.label ? sanitizeHTML(data.label) : undefined;
      if (data.recipientName !== undefined) sanitizedData.recipientName = sanitizeHTML(data.recipientName);
      if (data.phone !== undefined) sanitizedData.phone = sanitizeHTML(data.phone);
      if (data.fullAddress !== undefined) sanitizedData.fullAddress = sanitizeHTML(data.fullAddress);

      return tx.address.update({
        where: { id: addressId },
        data: sanitizedData,
      });
    });
  }

  static async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      throw new Error("Address not found or access denied");
    }

    return prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id: addressId },
      });

      // If deleted address was default, make another one default
      if (address.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId },
        });
        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });
  }

  // ==========================================
  // MULTI-STORE CART
  // ==========================================
  static async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        store: { select: { id: true, name: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                isActive: true,
                store: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      // Auto-create cart if missing
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          store: { select: { id: true, name: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  stock: true,
                  isActive: true,
                  store: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });
    }

    // Self-healing migration: if storeId is set on cart, clear it
    if (cart.storeId) {
      cart = await prisma.cart.update({
        where: { id: cart.id },
        data: { storeId: null },
        include: {
          store: { select: { id: true, name: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  stock: true,
                  isActive: true,
                  store: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  static async addItemToCart(userId: string, productId: string, quantity: number) {
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      throw new Error("Product not found or inactive");
    }

    let cart = await this.getCart(userId);

    return prisma.$transaction(async (tx) => {
      // Check if item already exists in cart
      const existingItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId,
          },
        },
      });

      if (existingItem) {
        return tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      } else {
        return tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        });
      }
    });
  }

  static async updateCartItem(userId: string, cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      throw new Error("Cart item not found or access denied");
    }

    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  static async removeCartItem(userId: string, cartItemId: string) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      throw new Error("Cart item not found or access denied");
    }

    return prisma.$transaction(async (tx) => {
      await tx.cartItem.delete({
        where: { id: cartItemId },
      });

      // Check if cart is now empty. If empty, reset storeId to null
      const remainingItemsCount = await tx.cartItem.count({
        where: { cartId: cartItem.cartId },
      });

      if (remainingItemsCount === 0) {
        await tx.cart.update({
          where: { id: cartItem.cartId },
          data: { storeId: null },
        });
      }
    });
  }

  static async clearCart(userId: string) {
    const cart = await this.getCart(userId);

    return prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: { storeId: null },
      });
    });
  }

  // ==========================================
  // CHECKOUT WITH TRANSACTION SAFETY
  // ==========================================
  static async checkout(
    userId: string,
    data: {
      deliveryMethod?: "INSTANT" | "NEXT_DAY" | "REGULAR";
      storeDeliveries?: { storeId: string; deliveryMethod: "INSTANT" | "NEXT_DAY" | "REGULAR" }[];
      discountCode?: string;
    }
  ) {
    const { deliveryMethod, storeDeliveries, discountCode } = data;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new Error("Your cart is empty");
    }

    // Group items by storeId
    const itemsByStore: { [storeId: string]: typeof cart.items } = {};
    for (const item of cart.items) {
      const sId = item.product.storeId;
      if (!itemsByStore[sId]) {
        itemsByStore[sId] = [];
      }
      itemsByStore[sId].push(item);
    }

    const storeIds = Object.keys(itemsByStore);

    // Map store delivery methods
    const storeDeliveryMethods: { [storeId: string]: "INSTANT" | "NEXT_DAY" | "REGULAR" } = {};
    if (storeDeliveries) {
      for (const sd of storeDeliveries) {
        storeDeliveryMethods[sd.storeId] = sd.deliveryMethod;
      }
    }

    const defaultMethod = deliveryMethod || "REGULAR";

    return prisma.$transaction(async (tx) => {
      const now = await getNow();

      // 1. Re-verify products stock and details & calculate subtotals per store
      const storeSubtotals: { [storeId: string]: number } = {};
      const orderItemsByStore: { [storeId: string]: any[] } = {};

      for (const storeId of storeIds) {
        let subtotal = 0;
        const items = itemsByStore[storeId];
        const orderItemsData = [];

        for (const item of items) {
          const dbProduct = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!dbProduct || !dbProduct.isActive) {
            throw new Error(`Product "${item.product.name}" is no longer available.`);
          }

          if (dbProduct.stock < item.quantity) {
            throw new Error(`Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock} items left.`);
          }

          subtotal += dbProduct.price * item.quantity;
          orderItemsData.push({
            productId: dbProduct.id,
            productNameSnapshot: dbProduct.name,
            priceSnapshot: dbProduct.price,
            quantity: item.quantity,
          });
        }

        storeSubtotals[storeId] = subtotal;
        orderItemsByStore[storeId] = orderItemsData;
      }

      const totalSubtotal = Object.values(storeSubtotals).reduce((sum, s) => sum + s, 0);

      // 2. Validate Discount Code (Voucher or Promo)
      let discountKind: "PERCENT" | "FLAT" | null = null;
      let discountValue: number | null = null;
      let discountType: "VOUCHER" | "PROMO" | null = null;
      let voucherToUpdate = null;

      if (discountCode && discountCode.trim() !== "") {
        const cleanCode = discountCode.trim().toUpperCase();

        // Check Voucher table first (takes precedence)
        const voucher = await tx.voucher.findUnique({
          where: { code: cleanCode },
        });

        if (voucher) {
          if (voucher.expiresAt < now) {
            throw new Error("Discount voucher has expired");
          }
          if (voucher.usageCount >= voucher.usageLimit) {
            throw new Error("Discount voucher usage limit reached");
          }
          discountKind = voucher.discountKind;
          discountValue = voucher.value;
          discountType = "VOUCHER";
          voucherToUpdate = voucher.id;
        } else {
          // Check Promo table
          const promo = await tx.promo.findUnique({
            where: { code: cleanCode },
          });

          if (promo) {
            if (promo.expiresAt < now) {
              throw new Error("Discount promo has expired");
            }
            discountKind = promo.discountKind;
            discountValue = promo.value;
            discountType = "PROMO";
          } else {
            throw new Error("Invalid discount code");
          }
        }
      }

      // Calculate total discount amount on totalSubtotal
      let totalDiscountAmount = 0;
      if (discountKind && discountValue) {
        if (discountKind === "PERCENT") {
          totalDiscountAmount = Math.floor((totalSubtotal * discountValue) / 100);
        } else if (discountKind === "FLAT") {
          totalDiscountAmount = discountValue;
        }
      }
      if (totalDiscountAmount > totalSubtotal) {
        totalDiscountAmount = totalSubtotal;
      }

      // Distribute discount proportionally across stores
      const storeDiscounts: { [storeId: string]: number } = {};
      let distributedDiscountSum = 0;
      const storeIdsList = Object.keys(storeSubtotals);

      for (let i = 0; i < storeIdsList.length; i++) {
        const storeId = storeIdsList[i];
        const storeSub = storeSubtotals[storeId];

        if (i === storeIdsList.length - 1) {
          // Last store gets the remainder
          const remainder = totalDiscountAmount - distributedDiscountSum;
          storeDiscounts[storeId] = Math.min(remainder, storeSub);
        } else {
          const propDiscount = Math.floor((storeSub / totalSubtotal) * totalDiscountAmount);
          const cappedDiscount = Math.min(propDiscount, storeSub);
          storeDiscounts[storeId] = cappedDiscount;
          distributedDiscountSum += cappedDiscount;
        }
      }

      // 3. Compute final pricing elements per store
      const pricingByStore: { [storeId: string]: any } = {};
      let grandTotal = 0;

      for (const storeId of storeIds) {
        const sub = storeSubtotals[storeId];
        const disc = storeDiscounts[storeId] || 0;
        const method = storeDeliveryMethods[storeId] || defaultMethod;
        const pricing = calculatePricing({
          subtotal: sub,
          deliveryMethod: method,
          discountKind: disc > 0 ? "FLAT" : null,
          discountValue: disc > 0 ? disc : 0,
        });
        pricingByStore[storeId] = pricing;
        grandTotal += pricing.total;
      }

      // 4. Validate Wallet Balance
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet || wallet.balance < grandTotal) {
        throw new Error(`Insufficient wallet balance. Total required is Rp ${grandTotal.toLocaleString("id-ID")}.`);
      }

      // 5. Decrement Stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      // 6. Deduct Wallet Balance and Create Transaction
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: grandTotal },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "PAYMENT",
          amount: grandTotal,
          note: `Payment for multi-store checkout of ${cart.items.length} item(s)`,
          createdAt: now,
        },
      });

      // 7. Increment Voucher Usage Count if applicable
      if (voucherToUpdate) {
        await tx.voucher.update({
          where: { id: voucherToUpdate },
          data: {
            usageCount: { increment: 1 },
          },
        });
      }

      // 8. Create the Orders
      const createdOrders = [];
      for (const storeId of storeIds) {
        const pricing = pricingByStore[storeId];
        const method = storeDeliveryMethods[storeId] || defaultMethod;

        const order = await tx.order.create({
          data: {
            buyerId: userId,
            storeId,
            deliveryMethod: method,
            subtotal: pricing.subtotal,
            discountAmount: pricing.discountAmount,
            discountType,
            discountCode: discountCode || null,
            deliveryFee: pricing.deliveryFee,
            ppn: pricing.ppn,
            total: pricing.total,
            status: "SEDANG_DIKEMAS",
            createdAt: now,
            items: {
              create: orderItemsByStore[storeId],
            },
            statusHistory: {
              create: {
                status: "SEDANG_DIKEMAS",
                note: "Order checked out successfully",
                changedAt: now,
              },
            },
          },
          include: {
            items: true,
            statusHistory: true,
          },
        });
        createdOrders.push(order);
      }

      // 9. Reset and clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: { storeId: null },
      });

      return createdOrders;
    });
  }

  // ==========================================
  // ORDERS
  // ==========================================
  static async listBuyerOrders(userId: string) {
    return prisma.order.findMany({
      where: { buyerId: userId },
      include: {
        store: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getOrderDetail(userId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: { select: { id: true, name: true } },
        items: true,
        statusHistory: { orderBy: { changedAt: "asc" } },
        deliveryJob: {
          include: {
            driver: { select: { username: true } },
          },
        },
      },
    });

    if (!order || order.buyerId !== userId) {
      throw new Error("Order not found or access denied");
    }

    return order;
  }
}
