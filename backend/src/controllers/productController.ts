import { Request, Response } from "express";
import { ProductService } from "../services/productService";

export class ProductController {
  static async list(req: Request, res: Response) {
    try {
      const products = await ProductService.listActiveProducts();
      return res.status(200).json(products);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to retrieve products" });
    }
  }

  static async getDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductDetail(id);
      return res.status(200).json(product);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || "Product not found" });
    }
  }
}
