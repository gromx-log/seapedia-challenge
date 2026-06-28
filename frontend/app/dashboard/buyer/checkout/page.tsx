"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, MapPin, Truck, Ticket, Receipt, ShieldCheck, AlertTriangle } from "lucide-react";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    price: number;
  };
}

interface CartData {
  items: CartItem[];
}

interface Address {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string;
  fullAddress: string;
  isDefault: boolean;
}

export default function BuyerCheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"INSTANT" | "NEXT_DAY" | "REGULAR">("REGULAR");
  
  // Discount States
  const [discountCode, setDiscountCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [discountKind, setDiscountKind] = useState<"PERCENT" | "FLAT" | null>(null);
  const [discountValue, setDiscountValue] = useState<number | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountSuccess, setDiscountSuccess] = useState<string | null>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchCheckoutData = async () => {
    try {
      // 1. Fetch Cart
      const cartRes = await fetch(`${API_URL}/api/buyer/cart`, { credentials: "include" });
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setCart(cartData);
      }

      // 2. Fetch Addresses
      const addrRes = await fetch(`${API_URL}/api/buyer/addresses`, { credentials: "include" });
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        setAddresses(addrData);
        // Pre-select default address
        const def = addrData.find((a: Address) => a.isDefault);
        if (def) {
          setSelectedAddressId(def.id);
        } else if (addrData.length > 0) {
          setSelectedAddressId(addrData[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      setError("Failed to fetch checkout details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckoutData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleApplyDiscount = async () => {
    setDiscountError(null);
    setDiscountSuccess(null);

    if (!discountCode.trim()) {
      setDiscountError("Please enter a code");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/buyer/discounts/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid discount code");
      }

      setAppliedCode(discountCode.trim().toUpperCase());
      setDiscountKind(data.discountKind);
      setDiscountValue(data.value);
      setDiscountSuccess(`Code "${discountCode.trim().toUpperCase()}" applied successfully!`);
    } catch (err: any) {
      setDiscountError(err.message);
      setAppliedCode("");
      setDiscountKind(null);
      setDiscountValue(null);
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      setError("Please add or select a shipping address");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/buyer/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethod,
          discountCode: appliedCode || undefined,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      // Checkout successful! Redirect to order detail page
      router.push(`/dashboard/buyer/orders/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-400">
        Loading checkout profile...
      </div>
    );
  }

  const cartItems = cart?.items || [];
  if (cartItems.length === 0) {
    return (
      <div className="flex-1 bg-neutral-950 px-4 py-12 flex flex-col items-center justify-center gap-4 text-neutral-400">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <p>Your cart is empty. Nothing to check out!</p>
        <Link href="/products" className="text-indigo-400 hover:underline">Go to Catalog</Link>
      </div>
    );
  }

  // 1. Calculate pricing breakdown locally for preview
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  let discountAmount = 0;
  if (discountKind && discountValue) {
    if (discountKind === "PERCENT") {
      discountAmount = Math.floor((subtotal * discountValue) / 100);
    } else if (discountKind === "FLAT") {
      discountAmount = discountValue;
    }
  }
  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  const deliveryFee = deliveryMethod === "INSTANT" ? 15000 : deliveryMethod === "NEXT_DAY" ? 8000 : 5000;
  const postDiscountSubtotal = subtotal - discountAmount;
  const ppn = Math.round(0.12 * postDiscountSubtotal);
  const total = postDiscountSubtotal + deliveryFee + ppn;

  const currentAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-1">
          <Link href="/dashboard/buyer/cart" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight">Checkout Order</h1>
          <p className="text-xs text-neutral-400">Complete delivery specifications and apply discounts</p>
        </div>

        {error && (
          <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 text-xs text-rose-400 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: configurations */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Shipping Address Selector */}
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Shipping Destination
              </h3>

              {addresses.length === 0 ? (
                <div className="bg-neutral-950 border border-neutral-850 p-6 rounded-2xl space-y-3 text-center">
                  <p className="text-xs text-neutral-500 italic">No addresses registered in address book.</p>
                  <Link
                    href="/dashboard/buyer/addresses"
                    className="inline-block text-xs font-bold text-indigo-400 hover:underline uppercase tracking-wide"
                  >
                    Register Address Now &rarr;
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                      Select Address
                    </label>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          [{a.label || "Home"}] {a.recipientName} ({a.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentAddress && (
                    <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl text-xs text-neutral-400 space-y-1">
                      <div className="font-bold text-white">{currentAddress.recipientName}</div>
                      <div>{currentAddress.phone}</div>
                      <p className="italic leading-relaxed mt-1.5">{currentAddress.fullAddress}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Method Selector */}
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                Delivery Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "REGULAR", label: "Regular Delivery", fee: 5000, desc: "Takes 3-5 working days" },
                  { id: "NEXT_DAY", label: "Next Day Service", fee: 8000, desc: "Delivered next morning" },
                  { id: "INSTANT", label: "Instant Delivery", fee: 15000, desc: "Arrives in 1-2 hours" },
                ].map((opt) => {
                  const isSelected = deliveryMethod === opt.id;
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setDeliveryMethod(opt.id as any)}
                      className={`flex flex-col text-left p-4 border rounded-2xl transition-all duration-200 gap-1.5 ${
                        isSelected
                          ? "bg-blue-950/40 border-blue-500 text-blue-400"
                          : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <span className="text-xs font-bold text-white uppercase">{opt.label}</span>
                      <span className="text-[10px] text-neutral-400">{opt.desc}</span>
                      <span className="text-xs font-extrabold mt-2 text-indigo-400">{formatCurrency(opt.fee)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discount Code Card */}
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-400" />
                Apply Voucher / Promo Code
              </h3>

              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="E.g. SEAPEDIA10"
                  className="bg-neutral-950 border border-neutral-850 rounded-xl py-2.5 px-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 flex-1 uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="px-6 py-2.5 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 text-xs font-semibold rounded-xl text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>

              {discountError && <p className="text-xs text-rose-400">{discountError}</p>}
              {discountSuccess && <p className="text-xs text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />{discountSuccess}</p>}
            </div>

          </div>

          {/* Right panel: Breakdowns */}
          <div className="lg:col-span-4 bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-neutral-400" />
              Order Summary
            </h3>

            {/* Items Snapshots */}
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 border-b border-neutral-850 pb-4 custom-scrollbar">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-neutral-300">
                  <span className="line-clamp-1">{item.product.name} (x{item.quantity})</span>
                  <span className="shrink-0">{formatCurrency(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-3 text-xs text-neutral-400 border-b border-neutral-850 pb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-neutral-200">{formatCurrency(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-purple-400 font-medium">
                  <span>Discount ({appliedCode})</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="text-neutral-200">{formatCurrency(deliveryFee)}</span>
              </div>

              <div className="flex justify-between">
                <span>PPN (12%)</span>
                <span className="text-neutral-200">{formatCurrency(ppn)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center text-white">
              <span className="text-sm font-bold">Total Payment</span>
              <span className="text-xl font-extrabold text-white">{formatCurrency(total)}</span>
            </div>

            {/* Pay Button */}
            <button
              onClick={handleCheckout}
              disabled={submitting || addresses.length === 0}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-650 hover:from-blue-600 hover:to-indigo-750 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all shadow-md shadow-indigo-900/25 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? "Processing Payment..." : "Confirm Purchase & Pay"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
