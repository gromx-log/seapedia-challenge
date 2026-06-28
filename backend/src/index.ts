import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Routes imports
import authRoutes from "./routes/authRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import productRoutes from "./routes/productRoutes";
import storeRoutes from "./routes/storeRoutes";
import sellerStoreRoutes from "./routes/sellerStoreRoutes";
import sellerProductRoutes from "./routes/sellerProductRoutes";
import buyerWalletRoutes from "./routes/buyerWalletRoutes";
import buyerAddressRoutes from "./routes/buyerAddressRoutes";
import buyerCartRoutes from "./routes/buyerCartRoutes";
import buyerCheckoutRoutes from "./routes/buyerCheckoutRoutes";
import buyerOrderRoutes from "./routes/buyerOrderRoutes";
import buyerDiscountRoutes from "./routes/buyerDiscountRoutes";
import reportRoutes from "./routes/reportRoutes";
import adminDiscountRoutes from "./routes/adminDiscountRoutes";
import sellerOrderRoutes from "./routes/sellerOrderRoutes";

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Cors configuration
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Basic health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/seller/store", sellerStoreRoutes);
app.use("/api/seller/products", sellerProductRoutes);
app.use("/api/seller/orders", sellerOrderRoutes);
app.use("/api/buyer/wallet", buyerWalletRoutes);
app.use("/api/buyer/addresses", buyerAddressRoutes);
app.use("/api/buyer/cart", buyerCartRoutes);
app.use("/api/buyer/checkout", buyerCheckoutRoutes);
app.use("/api/buyer/orders", buyerOrderRoutes);
app.use("/api/buyer/discounts", buyerDiscountRoutes);
app.use("/api", reportRoutes);
app.use("/api/admin", adminDiscountRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
// Nodemon reload trigger comment v2
