"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Store, ShoppingCart, Info, AlertTriangle, CheckCircle } from "lucide-react";

interface ProductDetail {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  isActive: boolean;
  store: {
    id: string;
    name: string;
    ownerId: string;
  };
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchProductDetail = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`);
      if (!res.ok) {
        throw new Error("Product not found");
      }
      const data = await res.json();
      setProduct(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/buyer/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product?.id,
          quantity,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        // Enforce the single-store cart rule error
        if (res.status === 409) {
          throw new Error(data.error || "Your cart is locked to a different store. Clear your cart to shop here.");
        }
        throw new Error(data.error || "Failed to add item to cart");
      }

      setSuccess("Product successfully added to your cart!");
      await refreshUser(); // Refreshes wallet/cart details if cached
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-400">
        Loading product details...
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <p>{error}</p>
        <Link href="/products" className="text-indigo-400 hover:underline">Back to Catalog</Link>
      </div>
    );
  }

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Link */}
        <Link href="/products" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-neutral-900 border border-neutral-850 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Left Info / Placeholder Illustration */}
          <div className="flex flex-col justify-center items-center bg-neutral-950 border border-neutral-850 rounded-2xl p-12 aspect-square relative group">
            <ShoppingCart className="w-20 h-20 text-neutral-700 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wider mt-4">Product Snapshot</span>
          </div>

          {/* Right Product details */}
          <div className="flex flex-col justify-between">
            <div className="space-y-4">
              {/* Store Reference */}
              <Link href={`/stores/${product.store.id}`} className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider hover:underline">
                <Store className="w-4 h-4" />
                {product.store.name}
              </Link>

              {/* Title */}
              <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">{product.name}</h1>

              {/* Price */}
              <div className="text-2xl font-extrabold text-white bg-neutral-950 px-4 py-2.5 rounded-xl border border-neutral-850 inline-block">
                {formatCurrency(product.price)}
              </div>

              {/* Description */}
              <div>
                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider block mb-1">Description</span>
                <p className="text-sm text-neutral-300 leading-relaxed italic">{product.description || "No description provided."}</p>
              </div>

              {/* Stock info */}
              <div>
                <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider block mb-1">Availability</span>
                <span className={`text-xs font-bold uppercase ${isOutOfStock ? "text-rose-400" : "text-emerald-400"}`}>
                  {isOutOfStock ? "Out of Stock" : `In Stock (${product.stock} units remaining)`}
                </span>
              </div>
            </div>

            {/* Shopping Block */}
            <div className="mt-8 pt-6 border-t border-neutral-850 space-y-4">
              {success && (
                <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {success}
                </div>
              )}

              {error && (
                <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 text-xs text-rose-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {user ? (
                user.activeRole === "BUYER" ? (
                  !isOutOfStock ? (
                    <div className="space-y-4">
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Quantity</span>
                        <div className="flex items-center border border-neutral-800 rounded-xl bg-neutral-950 overflow-hidden">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-3.5 py-1.5 hover:bg-neutral-850 text-neutral-300 font-bold transition-colors"
                          >
                            -
                          </button>
                          <span className="px-4 py-1.5 font-bold text-white text-sm">{quantity}</span>
                          <button
                            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                            className="px-3.5 py-1.5 hover:bg-neutral-850 text-neutral-300 font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={handleAddToCart}
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-lg shadow-indigo-900/20"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {submitting ? "Adding to Cart..." : "Add to Cart"}
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3.5 px-4 rounded-2xl text-sm font-semibold text-neutral-500 bg-neutral-950 border border-neutral-850 cursor-not-allowed"
                    >
                      Out of Stock
                    </button>
                  )
                ) : (
                  <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-4 text-xs text-amber-400 flex items-start gap-2.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Your active role is <span className="font-bold">{user.activeRole}</span>. Switch your active role to <span className="font-bold">BUYER</span> in the profile menu to add items to your cart.</span>
                  </div>
                )
              ) : (
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center py-3.5 px-4 rounded-2xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors text-center"
                >
                  Sign in to Purchase
                </Link>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
