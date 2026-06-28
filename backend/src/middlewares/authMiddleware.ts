import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    roles: string[];
    activeRole: string;
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const decoded = verifyToken(token);
  // Check that token exists, is valid, and is NOT a pre-auth token (pre-auth token is only for select-role)
  if (!decoded || decoded.isPreAuth) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  (req as AuthenticatedRequest).user = {
    userId: decoded.userId,
    username: decoded.username,
    roles: decoded.roles,
    activeRole: decoded.activeRole,
  };

  next();
}

export function requireRole(allowedRole: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (authReq.user.activeRole !== allowedRole) {
      return res.status(403).json({
        error: `Access denied. Active role must be ${allowedRole}. Current active role is ${authReq.user.activeRole}`,
      });
    }

    next();
  };
}
