"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Store, Tag, ShoppingBag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
}

interface StoreDetail {
  id: string;
  name: string;
  createdAt: string;
  products: Product[];
}

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchStoreDetail = async () => {
    try {
      const res = await fetch(`${API_URL}/api/stores/${id}`);
      if (!res.ok) {
        throw new Error("Store not found");
      }
      const data = await res.json();
      setStore(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load store details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreDetail();
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
        Loading store details...
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 gap-4">
        <Store className="w-12 h-12 text-rose-500" />
        <p>{error || "Store not found"}</p>
        <Link href="/products" className="text-indigo-400 hover:underline">Back to Catalog</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Back Link */}
        <Link href="/products" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>

        {/* Store Header Card */}
        <div className="bg-neutral-900 border border-neutral-850 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
            <div className="p-5 bg-neutral-950 border border-neutral-800 text-indigo-400 rounded-2xl inline-block self-start">
              <Store className="w-10 h-10" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">{store.name}</h1>
              <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                Joined since {new Date(store.createdAt).toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white font-serif">Active Products ({store.products.length})</h2>

          {store.products.length === 0 ? (
            <div className="bg-neutral-900/30 border border-neutral-900/60 p-12 text-center rounded-3xl text-neutral-500 text-sm">
              This store does not have any active products listed.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {store.products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-neutral-900 border border-neutral-850 rounded-3xl overflow-hidden hover:border-neutral-700 transition-all duration-300 flex flex-col group relative animate-in fade-in"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  
                  <div className="p-6 flex flex-col flex-1 relative z-10">
                    <h3 className="text-base font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      {prod.name}
                    </h3>

                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-6 italic">
                      {prod.description || "No description provided."}
                    </p>

                    <div className="mt-auto pt-4 border-t border-neutral-850 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider block">Price</span>
                        <span className="text-sm font-extrabold text-white">{formatCurrency(prod.price)}</span>
                      </div>

                      <Link
                        href={`/products/${prod.id}`}
                        className="p-2 bg-neutral-950 border border-neutral-800 rounded-xl hover:bg-indigo-650 hover:border-indigo-650 text-neutral-300 hover:text-white transition-all duration-200"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 bg-neutral-950 border border-neutral-800 text-[9px] text-neutral-400 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 uppercase">
                    <Tag className="w-2.5 h-2.5 text-neutral-500" />
                    Stock: {prod.stock}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
