"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Plus, Edit, Trash2, CheckCircle, X, Save, AlertTriangle } from "lucide-react";

interface Address {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  fullAddress: string;
  isDefault: boolean;
}

export default function BuyerAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form / Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [label, setLabel] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/buyer/addresses`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to fetch addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openCreateModal = () => {
    setEditingAddress(null);
    setLabel("");
    setRecipientName("");
    setPhone("");
    setFullAddress("");
    setIsDefault(false);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setLabel(addr.label || "");
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setFullAddress(addr.fullAddress);
    setIsDefault(addr.isDefault);
    setError(null);
    setSuccess(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const bodyData = {
      label: label.trim() || undefined,
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      fullAddress: fullAddress.trim(),
      isDefault,
    };

    try {
      let res;
      if (editingAddress) {
        res = await fetch(`${API_URL}/api/buyer/addresses/${editingAddress.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
          credentials: "include",
        });
      } else {
        res = await fetch(`${API_URL}/api/buyer/addresses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
          credentials: "include",
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save address");
      }

      setSuccess(editingAddress ? "Address successfully updated!" : "Address successfully created!");
      setModalOpen(false);
      fetchAddresses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${API_URL}/api/buyer/addresses/${addressId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete address");
      }

      setSuccess("Address deleted successfully!");
      fetchAddresses();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link href="/dashboard/buyer" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight flex items-center gap-2">
              <MapPin className="w-8 h-8 text-emerald-400" />
              Shipping Addresses
            </h1>
            <p className="text-xs text-neutral-400">Configure your shipping destinations and select primary addresses</p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-1.5 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-650 hover:from-blue-600 hover:to-indigo-750 text-white font-semibold rounded-2xl transition-all shadow-md shadow-indigo-900/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Address
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

        {/* Addresses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-900 h-48 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-neutral-900/30 border border-neutral-900/60 p-16 text-center rounded-3xl text-neutral-500 text-sm">
            No shipping addresses registered. Click "Add New Address" to define a delivery point.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-neutral-900 border p-6 rounded-3xl flex flex-col justify-between hover:border-neutral-700 transition-all duration-300 relative group overflow-hidden ${
                  addr.isDefault ? "border-emerald-900/60 shadow-md shadow-emerald-950/10" : "border-neutral-850"
                }`}
              >
                {/* Glow for default */}
                {addr.isDefault && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-xs bg-neutral-950 border border-neutral-800 text-neutral-300 px-2.5 py-1 rounded-lg uppercase font-bold tracking-wider">
                        {addr.label || "Home"}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded ml-2 uppercase font-extrabold tracking-wide">
                          Default
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-neutral-200">
                    <div className="font-bold text-white">{addr.recipientName}</div>
                    <div className="text-xs text-neutral-400">{addr.phone}</div>
                    <p className="text-xs text-neutral-400 leading-relaxed italic mt-2">{addr.fullAddress}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-neutral-850">
                  <button
                    onClick={() => openEditModal(addr)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-xs font-semibold rounded-xl text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Details
                  </button>

                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-2 border border-rose-950/40 hover:border-rose-900 bg-rose-950/20 text-rose-400 hover:text-rose-300 rounded-xl transition-colors cursor-pointer"
                    title="Delete Address"
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
                  <MapPin className="w-5 h-5 text-indigo-400" />
                  {editingAddress ? "Edit Address" : "Add Address"}
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
                {/* Label */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Address Label
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="E.g. Home, Office, Dorm"
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Recipient Name */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Full Address */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Full Delivery Address
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="Provide street names, block numbers, city, postcode details..."
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  ></textarea>
                </div>

                {/* Default Toggle */}
                <div className="flex items-center justify-between border-t border-neutral-850 pt-4">
                  <div>
                    <span className="text-xs font-semibold text-neutral-300 block">Set as Default</span>
                    <span className="text-[10px] text-neutral-500">Unsets other default addresses</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDefault(!isDefault)}
                    className={`text-xs font-bold uppercase px-3 py-1.5 rounded-xl border transition-all ${
                      isDefault
                        ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/50"
                        : "bg-rose-950/40 text-rose-400 border-rose-900/50"
                    }`}
                  >
                    {isDefault ? "Primary" : "Secondary"}
                  </button>
                </div>

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
                    {submitting ? "Saving..." : "Save Address"}
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
