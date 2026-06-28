"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Store, Tag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  store: {
    id: string;
    name: string;
  };
}

export default function ProductsCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Failed to load products:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.store.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold font-serif text-white tracking-tight">Public Catalog</h1>
            <p className="text-neutral-400 text-sm mt-1">Browse all available products from our verified stores.</p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product or store..."
              className="w-full bg-neutral-900 border border-neutral-850 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Catalog grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-900 h-80 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-neutral-900/30 border border-neutral-900/60 p-16 text-center rounded-3xl text-neutral-500 text-sm">
            No products match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-neutral-900 border border-neutral-850 rounded-3xl overflow-hidden hover:border-neutral-700 transition-all duration-300 flex flex-col group relative"
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1 relative z-10">
                  {/* Store Name */}
                  <Link
                    href={`/stores/${prod.store.id}`}
                    className="text-xs font-semibold text-neutral-500 hover:text-indigo-400 flex items-center gap-1 mb-3 transition-colors uppercase tracking-wider"
                  >
                    <Store className="w-3.5 h-3.5" />
                    {prod.store.name}
                  </Link>

                   {/* Product Name */}
                  <Link href={`/products/${prod.id}`}>
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-300 hover:underline transition-colors cursor-pointer">
                      {prod.name}
                    </h3>
                  </Link>

                  {/* Description */}
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-6 italic">
                    {prod.description || "No description provided."}
                  </p>

                  <div className="mt-auto pt-4 border-t border-neutral-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider block">Price</span>
                      <span className="text-base font-extrabold text-white">{formatCurrency(prod.price)}</span>
                    </div>

                    <Link
                      href={`/products/${prod.id}`}
                      className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl hover:bg-indigo-650 hover:border-indigo-650 text-neutral-300 hover:text-white transition-all duration-200 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Stock tag */}
                <div className="absolute top-4 right-4 bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1.5 uppercase">
                  <Tag className="w-3 h-3 text-neutral-500" />
                  Stock: {prod.stock}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
