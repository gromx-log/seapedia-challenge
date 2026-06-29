"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Calendar, Store, ArrowRight } from "lucide-react";

interface Order {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  deliveryMethod: string;
  store: {
    id: string;
    name: string;
  };
  items: {
    id: string;
    productNameSnapshot: string;
    quantity: number;
  }[];
}

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/buyer/orders`, {
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

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-1">
          <Link href="/dashboard/buyer" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-indigo-400" />
            Order Statements
          </h1>
          <p className="text-xs text-neutral-400">Review past transaction statements and track packages</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-900 h-32 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-neutral-900/30 border border-neutral-900/60 p-16 text-center rounded-3xl text-neutral-500 text-sm">
            You haven't placed any orders yet. Visit the catalog to start shopping!
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/buyer/orders/${order.id}`}
                className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl hover:border-neutral-750 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-3">
                  {/* Status & Date */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                      {new Date(order.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border bg-indigo-950/40 text-indigo-400 border-indigo-900/50">
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Store Name & Item snapshot */}
                  <div className="space-y-1">
                    <div className="font-bold text-white text-base flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-neutral-500" />
                      {order.store.name}
                    </div>
                    <p className="text-xs text-neutral-400">
                      {order.items.length} product(s): {order.items.map((it) => `${it.productNameSnapshot} (x${it.quantity})`).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-neutral-850 justify-between">
                  <div className="text-right">
                    <span className="text-[9px] text-neutral-500 uppercase font-semibold block">Total Payment</span>
                    <span className="font-extrabold text-white text-base">{formatCurrency(order.total)}</span>
                  </div>

                  <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
