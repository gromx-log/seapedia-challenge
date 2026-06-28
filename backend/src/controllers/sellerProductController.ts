import { Request, Response } from "express";
import { SellerService } from "../services/sellerService";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(2).max(100),
  price: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  description: z.string().optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  price: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export class SellerProductController {
  static async list(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const products = await SellerService.listProducts(authReq.user.userId);
      return res.status(200).json(products);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to list products" });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const parsed = createProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid product data", details: parsed.error.format() });
      }

      const product = await SellerService.createProduct(authReq.user.userId, parsed.data);
      return res.status(201).json(product);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create product" });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const parsed = updateProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid product data", details: parsed.error.format() });
      }

      const product = await SellerService.updateProduct(authReq.user.userId, id, parsed.data);
      return res.status(200).json(product);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to update product" });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) return res.status(401).json({ error: "Unauthorized" });

      const { id } = req.params;
      const product = await SellerService.deleteProduct(authReq.user.userId, id);
      return res.status(200).json({ message: "Product deleted successfully", product });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to delete product" });
    }
  }
}
