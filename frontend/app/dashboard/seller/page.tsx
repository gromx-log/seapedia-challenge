"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Store, Package, ShoppingCart, BarChart3, Edit, Plus, Info } from "lucide-react";

interface StoreData {
  id: string;
  name: string;
}

export default function SellerDashboardPage() {
  const { user, refreshUser } = useAuth();
  const [store, setStore] = useState<StoreData | null>(null);
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingStore, setCreatingStore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchStore = async () => {
    try {
      const res = await fetch(`${API_URL}/api/seller/store`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStore(data);
        if (data) {
          setStoreName(data.name);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, []);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatingStore(true);

    try {
      const res = await fetch(`${API_URL}/api/seller/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: storeName }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register store");
      }

      setStore(data);
      await refreshUser(); // Refreshes profile details (hasStore, storeId)
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingStore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-400">
        Loading dashboard...
      </div>
    );
  }

  // 1. If seller doesn't have a store, prompt store creation
  if (!store) {
    return (
      <div className="flex-1 bg-neutral-950 px-4 py-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-850 p-8 rounded-3xl space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex justify-center">
            <div className="p-4 bg-indigo-950/40 border border-indigo-900/40 text-indigo-400 rounded-2xl animate-bounce">
              <Store className="w-10 h-10" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-extrabold text-white font-serif tracking-tight">Open Your Store</h1>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Setup a unique store name to start listing products on the SEAPEDIA marketplace.
            </p>
          </div>

          {error && (
            <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 text-xs text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateStore} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Store Name
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="E.g. Toko Makmur Jaya"
                className="w-full bg-neutral-950 border border-neutral-850 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={creatingStore}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-colors cursor-pointer"
            >
              {creatingStore ? "Registering Store..." : "Register Store"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. If store exists, show seller control dashboard
  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-neutral-850 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="p-4 bg-neutral-950 border border-neutral-800 text-indigo-400 rounded-2xl">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Active Store</span>
              <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">{store.name}</h1>
            </div>
          </div>

          <Link
            href="/dashboard/seller/store"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-neutral-300 rounded-xl transition-all self-start md:self-center"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit Store Name
          </Link>
        </div>

        {/* Dashboard Actions/Shortcuts */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white font-serif">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Products CRUD */}
            <Link
              href="/dashboard/seller/products"
              className="bg-neutral-900 border border-neutral-850 p-8 rounded-3xl hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between group shadow-xl"
            >
              <div>
                <div className="w-12 h-12 bg-blue-950/40 border border-blue-900/40 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Product Catalog</h3>
                <p className="text-xs text-neutral-400 leading-relaxed italic">
                  Create, edit, toggle visibility, and delete products in your active store listing.
                </p>
              </div>
              <div className="mt-8 text-xs font-bold text-blue-400 group-hover:translate-x-1.5 transition-transform duration-200 flex items-center gap-1 uppercase tracking-wider">
                Manage Products &rarr;
              </div>
            </Link>

            {/* Incoming Orders */}
            <Link
              href="/dashboard/seller/orders"
              className="bg-neutral-900 border border-neutral-850 p-8 rounded-3xl hover:border-emerald-500/50 transition-all duration-300 flex flex-col justify-between group shadow-xl"
            >
              <div>
                <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-900/40 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Incoming Orders</h3>
                <p className="text-xs text-neutral-400 leading-relaxed italic">
                  Track delivery status, package items, and push orders forward in the logistics pipeline.
                </p>
              </div>
              <div className="mt-8 text-xs font-bold text-emerald-400 group-hover:translate-x-1.5 transition-transform duration-200 flex items-center gap-1 uppercase tracking-wider">
                Manage Orders &rarr;
              </div>
            </Link>

            {/* Income Report */}
            <Link
              href="/dashboard/seller/reports"
              className="bg-neutral-900 border border-neutral-850 p-8 rounded-3xl hover:border-purple-500/50 transition-all duration-300 flex flex-col justify-between group shadow-xl"
            >
              <div>
                <div className="w-12 h-12 bg-purple-950/40 border border-purple-900/40 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-105 transition-transform duration-200">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Income Reports</h3>
                <p className="text-xs text-neutral-400 leading-relaxed italic">
                  Review earnings charts, calculate gross sales, and summarize order transaction history.
                </p>
              </div>
              <div className="mt-8 text-xs font-bold text-purple-400 group-hover:translate-x-1.5 transition-transform duration-200 flex items-center gap-1 uppercase tracking-wider">
                View Reports &rarr;
              </div>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}
