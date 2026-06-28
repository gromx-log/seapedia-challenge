import prisma from "../config/prismaClient";
import { hashPassword, comparePassword } from "../utils/password";
import { RoleType } from "@prisma/client";

export class AuthService {
  static async registerUser(data: {
    username: string;
    email: string;
    password: string;
    roles: string[];
  }) {
    const { username, email, password, roles } = data;

    // Validate email & username uniqueness
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      throw new Error("Username or Email already registered");
    }

    // Filter and validate roles. Admin cannot be registered.
    const validRoles = roles
      .map((r) => r.toUpperCase())
      .filter((r) => ["BUYER", "SELLER", "DRIVER"].includes(r)) as RoleType[];

    if (validRoles.length === 0) {
      throw new Error("At least one valid role (BUYER, SELLER, DRIVER) must be specified");
    }

    const passwordHash = await hashPassword(password);

    // Create User, Roles, Wallet (if buyer), and Cart (if buyer) in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
          roles: {
            create: validRoles.map((role) => ({ role })),
          },
        },
        include: {
          roles: true,
        },
      });

      // Initialize wallet & cart if user is a buyer
      if (validRoles.includes("BUYER")) {
        await tx.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
          },
        });

        await tx.cart.create({
          data: {
            userId: user.id,
          },
        });
      }

      return user;
    });

    return {
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      roles: newUser.roles.map((r) => r.role),
    };
  }

  static async loginUser(data: { username: string; password: string }) {
    const { username, password } = data;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new Error("Invalid username or password");
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("Invalid username or password");
    }

    const userRoles = user.roles.map((r) => r.role);

    return {
      userId: user.id,
      username: user.username,
      roles: userRoles,
    };
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        store: true,
        wallet: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((r) => r.role),
      hasStore: !!user.store,
      storeId: user.store?.id || null,
      walletBalance: user.wallet?.balance ?? 0,
      createdAt: user.createdAt,
    };
  }
}
