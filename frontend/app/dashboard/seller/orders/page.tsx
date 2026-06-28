"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, Calendar, User, Package, ShieldCheck, AlertTriangle, CheckCircle } from "lucide-react";

interface Order {
  id: string;
  createdAt: string;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  ppn: number;
  total: number;
  status: string;
  deliveryMethod: string;
  buyer: {
    username: string;
    email: string;
  };
  items: {
    id: string;
    productNameSnapshot: string;
    priceSnapshot: number;
    quantity: number;
  }[];
}

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/seller/orders`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleProcessOrder = async (orderId: string) => {
    if (!confirm("Process this order? This will package the items and set the status to Awaiting Driver Pickup.")) return;
    setError(null);
    setSuccess(null);
    setProcessingId(orderId);

    try {
      const res = await fetch(`${API_URL}/api/seller/orders/${orderId}/process`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process order");
      }

      setSuccess("Order packaged successfully! Awaiting driver selection.");
      fetchOrders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-1">
          <Link href="/dashboard/seller" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-indigo-400" />
            Incoming Orders
          </h1>
          <p className="text-xs text-neutral-400">Review incoming buyer purchases and process logistics status</p>
        </div>

        {/* Notifications */}
        {success && (
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}
        {error && (
          <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 text-xs text-rose-400 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-900 h-40 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-neutral-900/30 border border-neutral-900/60 p-16 text-center rounded-3xl text-neutral-500 text-sm">
            No incoming orders placed for your store yet.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-6 hover:border-neutral-800 transition-all"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-850 pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                      {new Date(order.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border bg-indigo-950/40 text-indigo-400 border-indigo-900/50">
                      {order.status}
                    </span>

                    <span className="text-[9px] font-bold uppercase bg-neutral-950 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded">
                      ID: #{order.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
                    <User className="w-4 h-4 text-neutral-500" />
                    <span>Buyer: <span className="text-white font-bold">{order.buyer.username}</span></span>
                  </div>
                </div>

                {/* Items & details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Items snapshot */}
                  <div className="md:col-span-8 space-y-3">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Ordered Items</span>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-xs text-neutral-300 bg-neutral-950/40 border border-neutral-850/60 p-3 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{item.productNameSnapshot} <span className="text-neutral-500 font-normal">&times; {item.quantity}</span></span>
                          </div>
                          <span className="font-semibold text-neutral-400">{formatCurrency(item.priceSnapshot * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculations & Actions */}
                  <div className="md:col-span-4 bg-neutral-950/50 border border-neutral-850 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-neutral-400">
                        <span>Items Price</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                      </div>
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between text-purple-400">
                          <span>Discount Given</span>
                          <span>-{formatCurrency(order.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-neutral-300 font-bold border-t border-neutral-850 pt-2 text-sm">
                        <span>Total Paid</span>
                        <span>{formatCurrency(order.total - order.deliveryFee - order.ppn)}</span>
                      </div>
                      <div className="text-[9px] text-neutral-500 italic mt-1.5">
                        *Note: Delivery fees and PPN are handled by the system.
                      </div>
                    </div>

                    {/* Action button */}
                    {order.status === "SEDANG_DIKEMAS" && (
                      <button
                        onClick={() => handleProcessOrder(order.id)}
                        disabled={processingId === order.id}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-650 hover:to-teal-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {processingId === order.id ? "Processing..." : "Process Order (Package)"}
                      </button>
                    )}
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
