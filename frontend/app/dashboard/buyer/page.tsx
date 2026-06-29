"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Wallet, ShoppingCart, MapPin, ClipboardList, BarChart3, Plus, ArrowRight } from "lucide-react";

interface Order {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  store: {
    name: string;
  };
}

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchRecentOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/buyer/orders`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        // Take first 3 orders as recent
        setOrders(data.slice(0, 3));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!user) return null;

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-900 border border-neutral-850 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-2 relative z-10">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Buyer Hub</span>
            <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">Welcome back, {user.username}</h1>
            <p className="text-xs text-neutral-400 max-w-md">Manage your wallet, shopping cart, and track order deliveries.</p>
          </div>

          {/* Balance card */}
          <div className="bg-neutral-950 border border-neutral-850 px-6 py-4 rounded-2xl flex flex-col justify-center items-start gap-1 shrink-0 relative z-10">
            <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Wallet Balance</span>
            <div className="flex items-center gap-2 text-2xl font-extrabold text-emerald-400">
              <Wallet className="w-6 h-6" />
              <span>{formatCurrency(user.walletBalance)}</span>
            </div>
            <Link href="/dashboard/buyer/wallet" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider mt-2 hover:underline">
              Top Up Wallet &rarr;
            </Link>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white font-serif">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Cart */}
            <Link
              href="/dashboard/buyer/cart"
              className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl hover:border-neutral-750 transition-all duration-300 flex items-center gap-4 group"
            >
              <div className="p-3 bg-blue-950/40 border border-blue-900/30 text-blue-400 rounded-2xl group-hover:scale-105 transition-transform duration-200">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Shopping Cart</h3>
                <p className="text-[10px] text-neutral-500">Checkout your items</p>
              </div>
            </Link>

            {/* Addresses */}
            <Link
              href="/dashboard/buyer/addresses"
              className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl hover:border-neutral-750 transition-all duration-300 flex items-center gap-4 group"
            >
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 rounded-2xl group-hover:scale-105 transition-transform duration-200">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Shipping Addresses</h3>
                <p className="text-[10px] text-neutral-500">Manage address book</p>
              </div>
            </Link>

            {/* Orders */}
            <Link
              href="/dashboard/buyer/orders"
              className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl hover:border-neutral-750 transition-all duration-300 flex items-center gap-4 group"
            >
              <div className="p-3 bg-purple-950/40 border border-purple-900/30 text-purple-400 rounded-2xl group-hover:scale-105 transition-transform duration-200">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Order History</h3>
                <p className="text-[10px] text-neutral-500">Track current orders</p>
              </div>
            </Link>

            {/* Spending Reports */}
            <Link
              href="/dashboard/buyer/reports"
              className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl hover:border-neutral-750 transition-all duration-300 flex items-center gap-4 group"
            >
              <div className="p-3 bg-amber-950/40 border border-amber-900/30 text-amber-400 rounded-2xl group-hover:scale-105 transition-transform duration-200">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Spending Report</h3>
                <p className="text-[10px] text-neutral-500">View expenses charts</p>
              </div>
            </Link>

          </div>
        </div>

        {/* Recent Orders */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white font-serif">Recent Orders</h2>
            <Link href="/dashboard/buyer/orders" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1">
              View All Orders
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="bg-neutral-900 border border-neutral-900 h-32 rounded-3xl animate-pulse"></div>
          ) : orders.length === 0 ? (
            <div className="bg-neutral-900/30 border border-neutral-900/60 p-12 text-center rounded-3xl text-neutral-500 text-sm">
              You haven't placed any orders yet. Visit the catalog to start shopping!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/buyer/orders/${order.id}`}
                  className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl hover:border-neutral-750 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border bg-indigo-950/40 text-indigo-400 border-indigo-900/50">
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm line-clamp-1">{order.store.name}</h3>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-850 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">Total paid</span>
                    <span className="font-extrabold text-white text-sm">{formatCurrency(order.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
