"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Store, AlertTriangle, CheckCircle } from "lucide-react";

export default function SellerStoreSettingsPage() {
  const router = useRouter();
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchStore = async () => {
    try {
      const res = await fetch(`${API_URL}/api/seller/store`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setStoreName(data.name);
        } else {
          // If no store, redirect to create it on main dashboard
          router.push("/dashboard/seller");
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

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/seller/store`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: storeName }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update store name");
      }

      setSuccess("Store name successfully updated!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-400">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="flex-1 bg-neutral-950 px-4 py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-850 p-8 rounded-3xl space-y-6 relative overflow-hidden shadow-2xl animate-in fade-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Back Link */}
        <Link href="/dashboard/seller" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold text-white font-serif tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-400" />
            Store Settings
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Configure your active seller store details</p>
        </div>

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

        <form onSubmit={handleUpdateStore} className="space-y-6">
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
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
