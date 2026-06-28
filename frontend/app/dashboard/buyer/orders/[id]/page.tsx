"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Store, Truck, Receipt, Calendar, CheckCircle2, Clock, Package } from "lucide-react";

interface OrderItem {
  id: string;
  productNameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
}

interface StatusHistory {
  id: string;
  status: string;
  note: string | null;
  changedAt: string;
}

interface OrderDetail {
  id: string;
  createdAt: string;
  subtotal: number;
  discountAmount: number;
  discountCode: string | null;
  deliveryFee: number;
  deliveryMethod: string;
  ppn: number;
  total: number;
  status: string;
  store: {
    id: string;
    name: string;
  };
  items: OrderItem[];
  statusHistory: StatusHistory[];
}

export default function BuyerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchOrderDetail = async () => {
    try {
      const res = await fetch(`${API_URL}/api/buyer/orders/${id}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Order not found");
      }
      const data = await res.json();
      setOrder(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-400">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 gap-4">
        <ClipboardList className="w-12 h-12 text-rose-500" />
        <p>{error || "Order not found"}</p>
        <Link href="/dashboard/buyer/orders" className="text-indigo-400 hover:underline">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-1">
          <Link href="/dashboard/buyer/orders" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">Order Details</h1>
            <span className="text-[10px] font-bold bg-neutral-900 border border-neutral-850 text-neutral-400 px-3 py-1.5 rounded-xl uppercase tracking-wider self-start sm:self-center">
              Order ID: #{order.id.slice(0, 8)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Order breakdown + delivery details */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Store & Products */}
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
                <Link href={`/stores/${order.store.id}`} className="font-bold text-white text-base flex items-center gap-2 hover:text-indigo-400 transition-colors">
                  <Store className="w-5 h-5 text-indigo-400" />
                  {order.store.name}
                </Link>
                <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-neutral-600" />
                  {new Date(order.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Products list */}
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-neutral-950 border border-neutral-850 p-4 rounded-2xl hover:border-neutral-800 transition-all duration-150">
                    <div className="space-y-1">
                      <span className="font-bold text-white text-sm block">{item.productNameSnapshot}</span>
                      <span className="text-xs text-neutral-500">{formatCurrency(item.priceSnapshot)} &times; {item.quantity}</span>
                    </div>
                    <span className="font-extrabold text-neutral-300 text-sm">{formatCurrency(item.priceSnapshot * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Specifications */}
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                Delivery Details
              </h3>
              
              <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl text-xs text-neutral-400 space-y-2">
                <div className="flex justify-between text-neutral-300">
                  <span className="font-semibold">Logistics Method</span>
                  <span className="font-bold uppercase text-indigo-400">{order.deliveryMethod}</span>
                </div>
                <div className="flex justify-between text-neutral-300 border-t border-neutral-850/60 pt-2">
                  <span className="font-semibold">Delivery Fee</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right panel: Receipt calculations + timeline */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Calculation summary */}
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-neutral-400" />
                Receipt Calculations
              </h3>

              <div className="space-y-3 text-xs text-neutral-400 border-b border-neutral-850 pb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-purple-400">
                    <span>Discount ({order.discountCode})</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>

                <div className="flex justify-between">
                  <span>PPN (12%)</span>
                  <span>{formatCurrency(order.ppn)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-white">
                <span className="text-sm font-bold">Total Paid</span>
                <span className="text-lg font-extrabold text-white">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Status timeline (Section 5.6 requirements) */}
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl space-y-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Status Timeline
              </h3>

              <div className="relative pl-6 space-y-6 border-l border-neutral-850">
                {order.statusHistory.map((history, idx) => {
                  const isLast = idx === order.statusHistory.length - 1;
                  return (
                    <div key={history.id} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full border ${
                        isLast 
                          ? "bg-indigo-400 border-indigo-400 shadow-md shadow-indigo-400/20" 
                          : "bg-neutral-950 border-neutral-700"
                      }`}></span>

                      <div className="space-y-0.5 text-xs">
                        <span className={`font-bold uppercase tracking-wide block ${isLast ? "text-indigo-400" : "text-neutral-300"}`}>
                          {history.status}
                        </span>
                        {history.note && (
                          <span className="text-neutral-500 block italic">"{history.note}"</span>
                        )}
                        <span className="text-[9px] text-neutral-600 block pt-0.5 font-semibold">
                          {new Date(history.changedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
