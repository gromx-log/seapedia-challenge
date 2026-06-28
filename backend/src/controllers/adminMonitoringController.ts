import { Request, Response } from "express";
import { AdminService } from "../services/adminService";

export class AdminMonitoringController {
  static async getUsers(req: Request, res: Response) {
    try {
      const users = await AdminService.getUsers();
      return res.status(200).json(users);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  }

  static async getStores(req: Request, res: Response) {
    try {
      const stores = await AdminService.getStores();
      return res.status(200).json(stores);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch stores" });
    }
  }

  static async getProducts(req: Request, res: Response) {
    try {
      const products = await AdminService.getProducts();
      return res.status(200).json(products);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch products" });
    }
  }

  static async getOrders(req: Request, res: Response) {
    try {
      const orders = await AdminService.getOrders();
      return res.status(200).json(orders);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch orders" });
    }
  }

  static async getDeliveryJobs(req: Request, res: Response) {
    try {
      const jobs = await AdminService.getDeliveryJobs();
      return res.status(200).json(jobs);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch delivery jobs" });
    }
  }

  static async getOverdueOrders(req: Request, res: Response) {
    try {
      const overdue = await AdminService.getOverdueOrders();
      return res.status(200).json(overdue);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch overdue orders" });
    }
  }
}
