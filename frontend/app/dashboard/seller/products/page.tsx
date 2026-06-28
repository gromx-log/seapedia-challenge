"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Save, X, AlertTriangle, CheckCircle, Tag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  isActive: boolean;
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal / Form States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/seller/products`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName("");
    setPrice(0);
    setStock(0);
    setDescription("");
    setIsActive(true);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(prod.price);
    setStock(prod.stock);
    setDescription(prod.description || "");
    setIsActive(prod.isActive);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const bodyData = {
      name,
      price: Number(price),
      stock: Number(stock),
      description,
      isActive,
    };

    try {
      let res;
      if (editingProduct) {
        // Edit product
        res = await fetch(`${API_URL}/api/seller/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
          credentials: "include",
        });
      } else {
        // Create product
        res = await fetch(`${API_URL}/api/seller/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
          credentials: "include",
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      setSuccess(editingProduct ? "Product successfully updated!" : "Product successfully created!");
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? Ordered products will be deactivated instead of deleted.")) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/api/seller/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product");
      }

      setSuccess(data.product?.isActive === false 
        ? "Product has order history. It has been deactivated to preserve records." 
        : "Product deleted successfully!"
      );
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleProductActive = async (prod: Product) => {
    try {
      const res = await fetch(`${API_URL}/api/seller/products/${prod.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !prod.isActive }),
        credentials: "include",
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/dashboard/seller" className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">Product Catalog</h1>
            <p className="text-xs text-neutral-400">Manage store listings and items inventory</p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-650 hover:from-blue-600 hover:to-indigo-750 text-white font-semibold rounded-2xl transition-all shadow-md shadow-indigo-900/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>

        {/* Global Notifications */}
        {success && (
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}
        {error && !modalOpen && (
          <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 text-xs text-rose-400 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Catalog List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-900 h-64 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-neutral-900/30 border border-neutral-900/60 p-16 text-center rounded-3xl text-neutral-500 text-sm">
            You don't have any products in your catalog. Add a new product to start selling!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((prod) => (
              <div
                key={prod.id}
                className={`bg-neutral-900 border p-6 rounded-3xl flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 relative group overflow-hidden ${
                  !prod.isActive ? "opacity-60" : ""
                }`}
              >
                {/* Product Info */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                      {prod.name}
                    </h3>

                    {/* Active/Inactive Toggle Badge */}
                    <button
                      onClick={() => toggleProductActive(prod)}
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border transition-all ${
                        prod.isActive 
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900/40"
                          : "bg-rose-950/40 text-rose-400 border-rose-900/50 hover:bg-emerald-950/20 hover:text-emerald-400 hover:border-emerald-900/40"
                      }`}
                      title={prod.isActive ? "Click to Deactivate" : "Click to Activate"}
                    >
                      {prod.isActive ? "Active" : "Inactive"}
                    </button>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed italic">
                    {prod.description || "No description provided."}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-850">
                    <div>
                      <span className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wider block">Price</span>
                      <span className="text-sm font-extrabold text-white">{formatCurrency(prod.price)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wider block">Stock</span>
                      <span className="text-sm font-extrabold text-white">{prod.stock} items</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-neutral-850">
                  <button
                    onClick={() => openEditModal(prod)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-xs font-semibold rounded-xl text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Details
                  </button>

                  <button
                    onClick={() => handleDelete(prod.id)}
                    className="p-2 border border-rose-950/40 hover:border-rose-900 bg-rose-950/20 text-rose-400 hover:text-rose-300 rounded-xl transition-colors cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Overlay */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-neutral-900 border border-neutral-850 rounded-3xl p-6 relative overflow-hidden shadow-2xl space-y-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                <h3 className="text-lg font-bold text-white font-serif flex items-center gap-1.5">
                  <Tag className="w-5 h-5 text-indigo-400" />
                  {editingProduct ? "Edit Product" : "Create Product"}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 text-xs text-rose-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Sepatu Lari Premium"
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Price (Rp)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Stock
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description..."
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  ></textarea>
                </div>

                {/* Is Active Toggle (Only for edit) */}
                {editingProduct && (
                  <div className="flex items-center justify-between border-t border-neutral-850 pt-4">
                    <div>
                      <span className="text-xs font-semibold text-neutral-300 block">Catalog Visibility</span>
                      <span className="text-[10px] text-neutral-500">Toggle whether this product is visible in the shop</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`text-xs font-bold uppercase px-3 py-1.5 rounded-xl border transition-all ${
                        isActive
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50"
                          : "bg-rose-950/40 text-rose-400 border-rose-900/50"
                      }`}
                    >
                      {isActive ? "Visible" : "Hidden"}
                    </button>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-neutral-850">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-3 border border-neutral-850 text-neutral-400 text-xs font-semibold hover:text-white rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    {submitting ? "Saving..." : "Save Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
