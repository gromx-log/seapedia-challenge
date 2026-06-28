"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Trash2, Store, CreditCard, ChevronRight, Info } from "lucide-react";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
  };
}

interface CartData {
  id: string;
  storeId: string | null;
  store: {
    id: string;
    name: string;
  } | null;
  items: CartItem[];
}

export default function BuyerCartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API_URL}/api/buyer/cart`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (e) {
      console.error("Failed to fetch cart:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleUpdateQty = async (itemId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setUpdatingId(itemId);
    try {
      const res = await fetch(`${API_URL}/api/buyer/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
        credentials: "include",
      });

      if (res.ok) {
        fetchCart();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("Remove this item from your cart?")) return;
    setUpdatingId(itemId);
    try {
      const res = await fetch(`${API_URL}/api/buyer/cart/items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchCart();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    if (!confirm("Clear your entire cart?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/buyer/cart`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchCart();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-400">
        Loading cart details...
      </div>
    );
  }

  const items = cart?.items || [];
  const cartSubtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/products" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Catalog
            </Link>
            <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-indigo-400" />
              Shopping Cart
            </h1>
            <p className="text-xs text-neutral-400">Review selected products and proceed to payment calculations</p>
          </div>

          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="px-4 py-2 border border-rose-950/40 hover:border-rose-900 bg-rose-950/20 text-rose-400 hover:text-rose-350 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-neutral-900/30 border border-neutral-900/60 p-16 text-center rounded-3xl text-neutral-500 text-sm">
            Your shopping cart is empty. Browse the public catalog to find items!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Single store Banner (Section 5.2) */}
              {cart?.store && (
                <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-2xl p-4 text-xs text-indigo-400 flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Your cart is locked to <Link href={`/stores/${cart.store.id}`} className="font-bold underline">{cart.store.name}</Link>. To buy products from other stores, you must checkout or clear this cart first.
                  </span>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl flex items-center justify-between hover:border-neutral-800 transition-all duration-200"
                  >
                    <div className="space-y-1">
                      <h3 className="font-bold text-white text-base">{item.product.name}</h3>
                      <span className="text-xs text-neutral-400 block">{formatCurrency(item.product.price)} / unit</span>
                      {item.product.stock < item.quantity && (
                        <span className="text-[10px] text-rose-400 font-semibold uppercase">
                          Exceeds available stock ({item.product.stock})
                        </span>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-neutral-800 rounded-xl bg-neutral-950 overflow-hidden">
                        <button
                          disabled={updatingId === item.id}
                          onClick={() => handleUpdateQty(item.id, item.quantity, -1)}
                          className="px-3.5 py-1.5 hover:bg-neutral-850 text-neutral-300 font-bold disabled:opacity-50 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-3 py-1.5 font-bold text-white text-xs">{item.quantity}</span>
                        <button
                          disabled={updatingId === item.id || item.quantity >= item.product.stock}
                          onClick={() => handleUpdateQty(item.id, item.quantity, 1)}
                          className="px-3.5 py-1.5 hover:bg-neutral-850 text-neutral-300 font-bold disabled:opacity-50 transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={updatingId === item.id}
                        className="p-2 border border-neutral-850 hover:border-rose-900 bg-neutral-950 text-neutral-400 hover:text-rose-450 rounded-xl transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Column: Checkout Summary Card */}
            <div className="lg:col-span-4 bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Order Subtotal</h3>

              <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
                <span className="text-xs text-neutral-400">Subtotal</span>
                <span className="text-lg font-extrabold text-white">{formatCurrency(cartSubtotal)}</span>
              </div>

              <div className="text-[10px] text-neutral-500 italic">
                *Note: Delivery fees, discounts/vouchers, and PPN (12%) will be calculated on the next checkout step.
              </div>

              <Link
                href="/dashboard/buyer/checkout"
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-indigo-650 hover:from-blue-600 hover:to-indigo-755 text-white font-semibold rounded-2xl transition-all shadow-md shadow-indigo-900/20 cursor-pointer group"
              >
                <CreditCard className="w-4 h-4" />
                Proceed to Checkout
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
