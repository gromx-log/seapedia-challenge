import { Request, Response } from "express";
import { StoreService } from "../services/storeService";

export class StoreController {
  static async getDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const store = await StoreService.getStoreDetail(id);
      return res.status(200).json(store);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || "Store not found" });
    }
  }
}
