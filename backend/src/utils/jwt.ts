import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_seapedia_key_2026_challenge";

export interface JWTPayload {
  userId: string;
  username: string;
  roles: string[];
  activeRole: string;
}

export interface PreAuthPayload {
  userId: string;
  username: string;
  roles: string[];
  isPreAuth: boolean;
}

export function generateSessionToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "48h" });
}

export function generatePreAuthToken(payload: PreAuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "5m" });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
