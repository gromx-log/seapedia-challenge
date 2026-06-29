import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { generatePreAuthToken, generateSessionToken, verifyToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { z } from "zod";

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  roles: z.array(z.string()).min(1),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const selectRoleSchema = z.object({
  preAuthToken: z.string(),
  role: z.string(),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // In local dev we use http (localhost)
  sameSite: "lax" as const,
  maxAge: 48 * 60 * 60 * 1000, // 48 hours
  path: "/",
};

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request data", details: parsed.error.format() });
      }

      const result = await AuthService.registerUser(parsed.data);

      // If registered user only has 1 role, log them in automatically
      if (result.roles.length === 1) {
        const activeRole = result.roles[0];
        const token = generateSessionToken({
          userId: result.userId,
          username: result.username,
          roles: result.roles,
          activeRole,
        });

        res.cookie("token", token, COOKIE_OPTIONS);
        return res.status(201).json({
          message: "Registration and login successful",
          user: { ...result, activeRole },
        });
      }

      // If multiple roles, user must log in and select role
      return res.status(201).json({
        message: "Registration successful. Please log in.",
        user: result,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Registration failed" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid username or password" });
      }

      const user = await AuthService.loginUser(parsed.data);

      // If Admin role exists, it is exclusive
      if (user.roles.includes("ADMIN")) {
        const token = generateSessionToken({
          userId: user.userId,
          username: user.username,
          roles: user.roles,
          activeRole: "ADMIN",
        });

        res.cookie("token", token, COOKIE_OPTIONS);
        return res.status(200).json({
          message: "Admin login successful",
          user: { ...user, activeRole: "ADMIN" },
        });
      }

      // If user has exactly one non-admin role, log in immediately
      if (user.roles.length === 1) {
        const activeRole = user.roles[0];
        const token = generateSessionToken({
          userId: user.userId,
          username: user.username,
          roles: user.roles,
          activeRole,
        });

        res.cookie("token", token, COOKIE_OPTIONS);
        return res.status(200).json({
          message: "Login successful",
          user: { ...user, activeRole },
        });
      }

      // If user has more than one role, return pre-auth token
      const preAuthToken = generatePreAuthToken({
        userId: user.userId,
        username: user.username,
        roles: user.roles,
        isPreAuth: true,
      });

      return res.status(200).json({
        requiresRoleSelection: true,
        roles: user.roles,
        preAuthToken,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Login failed" });
    }
  }

  static async selectRole(req: Request, res: Response) {
    try {
      const parsed = selectRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid role selection request" });
      }

      const { preAuthToken, role } = parsed.data;
      const decoded = verifyToken(preAuthToken);

      if (!decoded || !decoded.isPreAuth) {
        return res.status(400).json({ error: "Invalid or expired pre-authorization token" });
      }

      const uppercaseRole = role.toUpperCase();
      if (!decoded.roles.includes(uppercaseRole)) {
        return res.status(403).json({ error: "You do not have access to this role" });
      }

      // Generate the actual session token with the active role
      const token = generateSessionToken({
        userId: decoded.userId,
        username: decoded.username,
        roles: decoded.roles,
        activeRole: uppercaseRole,
      });

      res.cookie("token", token, COOKIE_OPTIONS);
      return res.status(200).json({
        message: `Role ${uppercaseRole} activated`,
        user: {
          userId: decoded.userId,
          username: decoded.username,
          roles: decoded.roles,
          activeRole: uppercaseRole,
        },
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Role selection failed" });
    }
  }

  static async switchRole(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { role } = req.body;
      const uppercaseRole = role.toUpperCase();
      if (!authReq.user.roles.includes(uppercaseRole)) {
        return res.status(403).json({ error: "You do not have access to this role" });
      }

      const token = generateSessionToken({
        userId: authReq.user.userId,
        username: authReq.user.username,
        roles: authReq.user.roles,
        activeRole: uppercaseRole,
      });

      res.cookie("token", token, COOKIE_OPTIONS);
      return res.status(200).json({
        message: `Switched to role ${uppercaseRole}`,
        user: {
          userId: authReq.user.userId,
          username: authReq.user.username,
          roles: authReq.user.roles,
          activeRole: uppercaseRole,
        },
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Role switch failed" });
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie("token", { path: "/" });
    return res.status(200).json({ message: "Logged out successfully" });
  }

  static async me(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const profile = await AuthService.getUserProfile(authReq.user.userId);
      return res.status(200).json({
        ...profile,
        activeRole: authReq.user.activeRole,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch user profile" });
    }
  }
}
