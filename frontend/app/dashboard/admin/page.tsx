"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, Users, ShoppingBag, Store, Calendar, Plus, RefreshCw, AlertTriangle, HelpCircle, Truck, Trash2 } from "lucide-react";

interface UserItem {
  id: string;
  username: string;
  email: string;
  roles: { role: string }[];
  createdAt: string;
}

interface StoreItem {
  id: string;
  name: string;
  owner: { username: string };
  products: { id: string }[];
  createdAt: string;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  store: { name: string };
  createdAt: string;
}

interface OrderItem {
  id: string;
  buyer: { username: string };
  store: { name: string };
  total: number;
  status: string;
  deliveryMethod: string;
  createdAt: string;
}

interface JobItem {
  id: string;
  status: string;
  driver: { username: string } | null;
  earningAmount: number | null;
  createdAt: string;
  order: { total: number; deliveryMethod: string; store: { name: string } };
}

interface DiscountItem {
  id: string;
  code: string;
  discountKind: "PERCENT" | "FLAT";
  value: number;
  expiresAt: string;
  usageLimit?: number;
  usageCount?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"monitoring" | "discounts" | "clock">("monitoring");
  const [monitorSubTab, setMonitorSubTab] = useState<"users" | "stores" | "products" | "orders" | "jobs" | "overdue">("users");
  
  // Monitoring lists
  const [users, setUsers] = useState<UserItem[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [overdueSummary, setOverdueSummary] = useState<{ overdue: any[]; history: any[] }>({ overdue: [], history: [] });

  // Clock
  const [simulatedClock, setSimulatedClock] = useState<{ offsetMs: number; simulatedTime: string | Date }>({ offsetMs: 0, simulatedTime: "" });
  const [advanceDays, setAdvanceDays] = useState<number>(1);
  const [clockActionLoading, setClockActionLoading] = useState<boolean>(false);
  const [clockActionResult, setClockActionResult] = useState<any | null>(null);

  // Discounts (Vouchers/Promos)
  const [discountType, setDiscountType] = useState<"VOUCHER" | "PROMO">("VOUCHER");
  const [code, setCode] = useState("");
  const [discountKind, setDiscountKind] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [value, setValue] = useState<number>(10);
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [vouchers, setVouchers] = useState<DiscountItem[]>([]);
  const [promos, setPromos] = useState<DiscountItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [discountActionLoading, setDiscountActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  const loadMonitoringData = useCallback(async () => {
    if (!user || user.activeRole !== "ADMIN") return;
    setLoading(true);
    setError(null);
    try {
      if (monitorSubTab === "users") {
        const res = await fetch(`${API_URL}/api/admin/monitoring/users`, { credentials: "include" });
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else if (monitorSubTab === "stores") {
        const res = await fetch(`${API_URL}/api/admin/monitoring/stores`, { credentials: "include" });
        const data = await res.json();
        setStores(Array.isArray(data) ? data : []);
      } else if (monitorSubTab === "products") {
        const res = await fetch(`${API_URL}/api/admin/monitoring/products`, { credentials: "include" });
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } else if (monitorSubTab === "orders") {
        const res = await fetch(`${API_URL}/api/admin/monitoring/orders`, { credentials: "include" });
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } else if (monitorSubTab === "jobs") {
        const res = await fetch(`${API_URL}/api/admin/monitoring/delivery-jobs`, { credentials: "include" });
        const data = await res.json();
        setJobs(Array.isArray(data) ? data : []);
      } else if (monitorSubTab === "overdue") {
        const res = await fetch(`${API_URL}/api/admin/monitoring/overdue-orders`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setOverdueSummary(data);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch monitoring data.");
    } finally {
      setLoading(false);
    }
  }, [user, monitorSubTab]);

  const loadDiscountsData = useCallback(async () => {
    try {
      const vRes = await fetch(`${API_URL}/api/admin/vouchers`, { credentials: "include" });
      if (vRes.ok) {
        const vData = await vRes.json();
        setVouchers(Array.isArray(vData) ? vData : []);
      }

      const pRes = await fetch(`${API_URL}/api/admin/promos`, { credentials: "include" });
      if (pRes.ok) {
        const pData = await pRes.json();
        setPromos(Array.isArray(pData) ? pData : []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadClockData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/system-clock`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSimulatedClock(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "monitoring") {
      loadMonitoringData();
    } else if (activeTab === "discounts") {
      loadDiscountsData();
    } else if (activeTab === "clock") {
      loadClockData();
    }
  }, [activeTab, monitorSubTab, loadMonitoringData, loadDiscountsData, loadClockData]);

  // Handle advancing system time
  const handleAdvanceClock = async (e: React.FormEvent) => {
    e.preventDefault();
    setClockActionLoading(true);
    setError(null);
    setClockActionResult(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/system-clock/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: advanceDays }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to advance clock");
      setClockActionResult(data);
      alert(`System time advanced by ${advanceDays} day(s)! Overdue sweep triggered.`);
      await loadClockData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClockActionLoading(false);
    }
  };

  // Handle generating discounts
  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountActionLoading(true);
    setError(null);
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + expiresInDays);
      const payload: any = {
        code,
        discountKind,
        value,
        expiresAt: expiry.toISOString(),
      };
      if (discountType === "VOUCHER") {
        payload.usageLimit = usageLimit;
      }

      const endpoint = discountType === "VOUCHER" ? "vouchers" : "promos";
      const res = await fetch(`${API_URL}/api/admin/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to create ${discountType.toLowerCase()}`);
      
      alert(`${discountType} created successfully!`);
      setCode("");
      await loadDiscountsData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDiscountActionLoading(false);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!confirm("Are you sure you want to delete this voucher?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/vouchers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete voucher");
      alert("Voucher deleted successfully!");
      await loadDiscountsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/promos/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete promo");
      alert("Promo deleted successfully!");
      await loadDiscountsData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex-1 bg-neutral-950 text-neutral-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-serif flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-amber-500" />
              Admin Portal
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Marketplace oversight, coupon orchestration, and simulated time machine operations.
            </p>
          </div>
          
          <button 
            onClick={() => {
              loadMonitoringData();
              loadDiscountsData();
              loadClockData();
            }}
            className="flex items-center gap-2 bg-neutral-900 border border-neutral-850 hover:border-neutral-700 px-4 py-2 rounded-xl text-sm font-semibold text-neutral-300 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-950/40 border border-rose-900/60 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Root Tabs */}
        <div className="flex border-b border-neutral-850 gap-6 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("monitoring")}
            className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 shrink-0 ${
              activeTab === "monitoring"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            Marketplace Monitoring
          </button>
          <button
            onClick={() => setActiveTab("discounts")}
            className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 shrink-0 ${
              activeTab === "discounts"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            Discounts Management
          </button>
          <button
            onClick={() => setActiveTab("clock")}
            className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 shrink-0 ${
              activeTab === "clock"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            Simulate System Clock
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">

          {/* TAB 1: Marketplace Monitoring */}
          {activeTab === "monitoring" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Sidebar Tabs */}
              <div className="lg:col-span-1 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
                <button
                  onClick={() => setMonitorSubTab("users")}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide text-left border w-full transition-all duration-200 shrink-0 lg:shrink ${
                    monitorSubTab === "users"
                      ? "bg-amber-950/20 border-amber-900/60 text-amber-400"
                      : "bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Users List
                </button>
                <button
                  onClick={() => setMonitorSubTab("stores")}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide text-left border w-full transition-all duration-200 shrink-0 lg:shrink ${
                    monitorSubTab === "stores"
                      ? "bg-amber-950/20 border-amber-900/60 text-amber-400"
                      : "bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white"
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Stores List
                </button>
                <button
                  onClick={() => setMonitorSubTab("products")}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide text-left border w-full transition-all duration-200 shrink-0 lg:shrink ${
                    monitorSubTab === "products"
                      ? "bg-amber-950/20 border-amber-900/60 text-amber-400"
                      : "bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Products Catalog
                </button>
                <button
                  onClick={() => setMonitorSubTab("orders")}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide text-left border w-full transition-all duration-200 shrink-0 lg:shrink ${
                    monitorSubTab === "orders"
                      ? "bg-amber-950/20 border-amber-900/60 text-amber-400"
                      : "bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Orders Ledger
                </button>
                <button
                  onClick={() => setMonitorSubTab("jobs")}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide text-left border w-full transition-all duration-200 shrink-0 lg:shrink ${
                    monitorSubTab === "jobs"
                      ? "bg-amber-950/20 border-amber-900/60 text-amber-400"
                      : "bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white"
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Delivery Jobs
                </button>
                <button
                  onClick={() => setMonitorSubTab("overdue")}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide text-left border w-full transition-all duration-200 shrink-0 lg:shrink ${
                    monitorSubTab === "overdue"
                      ? "bg-amber-950/20 border-amber-900/60 text-amber-400"
                      : "bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  SLA Overdue Monitor
                </button>
              </div>

              {/* Data Table */}
              <div className="lg:col-span-3 bg-neutral-900 border border-neutral-850 rounded-2xl shadow-xl overflow-hidden p-6">
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-neutral-400">Loading monitoring data...</span>
                  </div>
                ) : (
                  <div>
                    {monitorSubTab === "users" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-neutral-800 text-xs font-bold uppercase text-neutral-400 bg-neutral-950/50">
                              <th className="p-4">Username</th>
                              <th className="p-4">Email</th>
                              <th className="p-4">Roles</th>
                              <th className="p-4">Created At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800 text-sm text-neutral-300">
                            {users.map((u) => (
                              <tr key={u.id} className="hover:bg-neutral-800/20">
                                <td className="p-4 font-semibold text-white">{u.username}</td>
                                <td className="p-4">{u.email}</td>
                                <td className="p-4">
                                  <div className="flex flex-wrap gap-1">
                                    {u.roles.map((r, i) => (
                                      <span key={i} className="text-[10px] font-bold bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded text-neutral-400 uppercase">
                                        {r.role}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 text-xs text-neutral-500">
                                  {new Date(u.createdAt).toLocaleString("id-ID")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {monitorSubTab === "stores" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-neutral-800 text-xs font-bold uppercase text-neutral-400 bg-neutral-950/50">
                              <th className="p-4">Store Name</th>
                              <th className="p-4">Owner</th>
                              <th className="p-4 text-center">Products Count</th>
                              <th className="p-4">Created At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800 text-sm text-neutral-300">
                            {stores.map((s) => (
                              <tr key={s.id} className="hover:bg-neutral-800/20">
                                <td className="p-4 font-semibold text-white">{s.name}</td>
                                <td className="p-4 text-neutral-400">{s.owner?.username || "-"}</td>
                                <td className="p-4 text-center text-neutral-200 font-semibold">{s.products?.length || 0}</td>
                                <td className="p-4 text-xs text-neutral-500">
                                  {new Date(s.createdAt).toLocaleString("id-ID")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {monitorSubTab === "products" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-neutral-800 text-xs font-bold uppercase text-neutral-400 bg-neutral-950/50">
                              <th className="p-4">Product</th>
                              <th className="p-4">Store</th>
                              <th className="p-4">Price</th>
                              <th className="p-4 text-center">Stock</th>
                              <th className="p-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800 text-sm text-neutral-300">
                            {products.map((p) => (
                              <tr key={p.id} className="hover:bg-neutral-800/20">
                                <td className="p-4 font-semibold text-white">{p.name}</td>
                                <td className="p-4 text-neutral-450">{p.store?.name}</td>
                                <td className="p-4 font-mono font-bold text-neutral-200">{formatCurrency(p.price)}</td>
                                <td className="p-4 text-center font-semibold">{p.stock}</td>
                                <td className="p-4">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    p.isActive 
                                      ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40" 
                                      : "bg-neutral-850 text-neutral-500 border border-neutral-800"
                                  }`}>
                                    {p.isActive ? "ACTIVE" : "INACTIVE"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {monitorSubTab === "orders" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-neutral-800 text-xs font-bold uppercase text-neutral-400 bg-neutral-950/50">
                              <th className="p-4">Buyer</th>
                              <th className="p-4">Store</th>
                              <th className="p-4">Method</th>
                              <th className="p-4">Total</th>
                              <th className="p-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800 text-sm text-neutral-300">
                            {orders.map((o) => (
                              <tr key={o.id} className="hover:bg-neutral-800/20">
                                <td className="p-4 font-semibold text-white">{o.buyer?.username}</td>
                                <td className="p-4 text-neutral-400">{o.store?.name}</td>
                                <td className="p-4 text-xs font-semibold">{o.deliveryMethod}</td>
                                <td className="p-4 font-mono font-bold text-neutral-200">{formatCurrency(o.total)}</td>
                                <td className="p-4">
                                  <span className="text-[10px] font-bold bg-neutral-950 border border-neutral-850 px-2 py-0.5 rounded uppercase tracking-wider text-indigo-400">
                                    {o.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {monitorSubTab === "jobs" && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-neutral-800 text-xs font-bold uppercase text-neutral-400 bg-neutral-950/50">
                              <th className="p-4">Store</th>
                              <th className="p-4">Courier</th>
                              <th className="p-4">Method</th>
                              <th className="p-4">Job Status</th>
                              <th className="p-4 text-right">Earning</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800 text-sm text-neutral-300">
                            {jobs.map((j) => (
                              <tr key={j.id} className="hover:bg-neutral-800/20">
                                <td className="p-4 font-semibold text-white">{j.order?.store?.name || "-"}</td>
                                <td className="p-4 text-neutral-450">{j.driver?.username || "Unassigned"}</td>
                                <td className="p-4 text-xs">{j.order?.deliveryMethod || "-"}</td>
                                <td className="p-4">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                    j.status === "AVAILABLE" ? "bg-blue-950/40 text-blue-400 border border-blue-900/40" :
                                    j.status === "TAKEN" ? "bg-amber-950/40 text-amber-400 border border-amber-900/40" :
                                    j.status === "COMPLETED" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40" :
                                    "bg-rose-950/40 text-rose-400 border border-rose-900/40"
                                  }`}>
                                    {j.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-emerald-400">
                                  {j.earningAmount ? formatCurrency(j.earningAmount) : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {monitorSubTab === "overdue" && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-md font-bold text-white mb-3">Pending Overdue Sweep ({overdueSummary.overdue?.length || 0})</h3>
                          {overdueSummary.overdue?.length === 0 ? (
                            <p className="text-xs text-neutral-500 italic bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                              No orders are currently overdue. Advance the clock to push active orders past their SLA.
                            </p>
                          ) : (
                            <div className="overflow-x-auto border border-neutral-800 rounded-xl bg-neutral-950/50">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-neutral-800 text-xs font-bold uppercase text-neutral-400">
                                    <th className="p-3">Buyer</th>
                                    <th className="p-3">Store</th>
                                    <th className="p-3">Method</th>
                                    <th className="p-3">Ordered At</th>
                                    <th className="p-3 text-right">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-850 text-xs text-neutral-350">
                                  {overdueSummary.overdue.map((o: any) => (
                                    <tr key={o.id}>
                                      <td className="p-3 font-semibold text-white">{o.buyerName}</td>
                                      <td className="p-3">{o.storeName}</td>
                                      <td className="p-3">{o.deliveryMethod}</td>
                                      <td className="p-3 text-neutral-550">{new Date(o.createdAt).toLocaleString("id-ID")}</td>
                                      <td className="p-3 text-right font-mono font-bold text-neutral-250">{formatCurrency(o.total)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-md font-bold text-white mb-3">Auto-Returned History ({overdueSummary.history?.length || 0})</h3>
                          {overdueSummary.history?.length === 0 ? (
                            <p className="text-xs text-neutral-500 italic bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                              No orders have been auto-returned yet.
                            </p>
                          ) : (
                            <div className="overflow-x-auto border border-neutral-800 rounded-xl bg-neutral-950/50">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-neutral-800 text-xs font-bold uppercase text-neutral-400">
                                    <th className="p-3">Buyer</th>
                                    <th className="p-3">Store</th>
                                    <th className="p-3">Method</th>
                                    <th className="p-3">Ordered At</th>
                                    <th className="p-3 text-right">Refunded Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-850 text-xs text-neutral-350">
                                  {overdueSummary.history.map((o: any) => (
                                    <tr key={o.id}>
                                      <td className="p-3 font-semibold text-white">{o.buyerName}</td>
                                      <td className="p-3">{o.storeName}</td>
                                      <td className="p-3">{o.deliveryMethod}</td>
                                      <td className="p-3 text-neutral-550">{new Date(o.createdAt).toLocaleString("id-ID")}</td>
                                      <td className="p-3 text-right font-mono font-bold text-emerald-400">{formatCurrency(o.total)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Discounts Management */}
          {activeTab === "discounts" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Creator Form */}
              <div className="lg:col-span-1 bg-neutral-900 border border-neutral-850 p-6 rounded-2xl shadow-xl space-y-6">
                <h3 className="text-lg font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-500" />
                  Generate Coupon
                </h3>
                
                <form onSubmit={handleCreateDiscount} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400 font-bold uppercase tracking-wide">Discount Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDiscountType("VOUCHER")}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                          discountType === "VOUCHER"
                            ? "bg-amber-950/20 border-amber-900 text-amber-400"
                            : "bg-neutral-950 border-neutral-850 text-neutral-450 hover:text-white"
                        }`}
                      >
                        Voucher (Usage Counter)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType("PROMO")}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                          discountType === "PROMO"
                            ? "bg-amber-950/20 border-amber-900 text-amber-400"
                            : "bg-neutral-950 border-neutral-850 text-neutral-450 hover:text-white"
                        }`}
                      >
                        Promo (No Limits)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-bold uppercase tracking-wide">Unique Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MEGAPROMO15"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-750 focus:border-amber-500 px-3 py-2 rounded-xl text-sm font-semibold tracking-wider font-mono outline-none text-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 font-bold uppercase tracking-wide">Kind</label>
                      <select
                        value={discountKind}
                        onChange={(e) => setDiscountKind(e.target.value as any)}
                        className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-750 px-3 py-2 rounded-xl text-sm font-semibold outline-none text-white transition-all"
                      >
                        <option value="PERCENT">Percentage (%)</option>
                        <option value="FLAT">Flat Rupiah</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 font-bold uppercase tracking-wide">Discount Value</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={value}
                        onChange={(e) => setValue(parseInt(e.target.value) || 0)}
                        className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-750 focus:border-amber-500 px-3 py-2 rounded-xl text-sm font-bold font-mono outline-none text-white transition-all"
                      />
                    </div>
                  </div>

                  {discountType === "VOUCHER" && (
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 font-bold uppercase tracking-wide">Usage Limit</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={usageLimit}
                        onChange={(e) => setUsageLimit(parseInt(e.target.value) || 0)}
                        className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-750 focus:border-amber-500 px-3 py-2 rounded-xl text-sm font-bold font-mono outline-none text-white transition-all"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-bold uppercase tracking-wide">Expires In (Days)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 0)}
                      className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-750 focus:border-amber-500 px-3 py-2 rounded-xl text-sm font-bold font-mono outline-none text-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={discountActionLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-neutral-950 font-extrabold py-3 rounded-xl transition-all duration-200 shadow-md shadow-amber-950/40 flex items-center justify-center gap-2 mt-4"
                  >
                    {discountActionLoading ? (
                      <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Generate Code"
                    )}
                  </button>
                </form>
              </div>

              {/* Coupons List */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Vouchers */}
                <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-2xl shadow-xl">
                  <h3 className="text-md font-bold text-white mb-4">Seeded Vouchers</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-neutral-800 text-neutral-500 uppercase font-bold">
                          <th className="pb-3">Code</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Value</th>
                          <th className="pb-3 text-center">Usage Count</th>
                          <th className="pb-3">Expires At</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-850 text-neutral-300 font-medium">
                        {vouchers.map((v) => (
                          <tr key={v.id}>
                            <td className="py-2.5 font-bold font-mono text-white text-sm">{v.code}</td>
                            <td className="py-2.5">{v.discountKind}</td>
                            <td className="py-2.5 font-mono">
                              {v.discountKind === "PERCENT" ? `${v.value}%` : formatCurrency(v.value)}
                            </td>
                            <td className="py-2.5 text-center font-mono font-bold text-neutral-450">
                              {v.usageCount} / {v.usageLimit}
                            </td>
                            <td className="py-2.5 text-neutral-500">{new Date(v.expiresAt).toLocaleDateString("id-ID")}</td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => handleDeleteVoucher(v.id)}
                                className="p-1.5 hover:bg-rose-950/40 text-rose-500 hover:text-rose-400 rounded-lg transition-colors border border-transparent hover:border-rose-900/35 cursor-pointer"
                                title="Delete Voucher"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Promos */}
                <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-2xl shadow-xl">
                  <h3 className="text-md font-bold text-white mb-4">Seeded Promos</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-neutral-800 text-neutral-500 uppercase font-bold">
                          <th className="pb-3">Code</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Value</th>
                          <th className="pb-3">Expires At</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-850 text-neutral-300 font-medium">
                        {promos.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2.5 font-bold font-mono text-white text-sm">{p.code}</td>
                            <td className="py-2.5">{p.discountKind}</td>
                            <td className="py-2.5 font-mono">
                              {p.discountKind === "PERCENT" ? `${p.value}%` : formatCurrency(p.value)}
                            </td>
                            <td className="py-2.5 text-neutral-500">{new Date(p.expiresAt).toLocaleDateString("id-ID")}</td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => handleDeletePromo(p.id)}
                                className="p-1.5 hover:bg-rose-950/40 text-rose-500 hover:text-rose-400 rounded-lg transition-colors border border-transparent hover:border-rose-900/35 cursor-pointer"
                                title="Delete Promo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: Simulate System Clock */}
          {activeTab === "clock" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Clock Advance Form */}
              <div className="lg:col-span-1 bg-neutral-900 border border-neutral-850 p-6 rounded-2xl shadow-xl space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    Time Control Machine
                  </h3>
                  
                  <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-850 flex flex-col items-center justify-center py-6 text-center space-y-2">
                    <span className="text-[10px] font-bold bg-neutral-900 border border-neutral-800 text-neutral-450 px-2 py-0.5 rounded tracking-wide uppercase">
                      Simulated Clock Time
                    </span>
                    <span className="text-lg font-extrabold text-white font-serif tracking-tight">
                      {simulatedClock.simulatedTime ? new Date(simulatedClock.simulatedTime).toLocaleString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }) : "Loading time..."}
                    </span>
                  </div>

                  <form onSubmit={handleAdvanceClock} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 font-bold uppercase tracking-wide">Advance Time (In Days)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={advanceDays}
                        onChange={(e) => setAdvanceDays(parseInt(e.target.value) || 1)}
                        className="w-full bg-neutral-950 border border-neutral-850 hover:border-neutral-750 focus:border-amber-500 px-3 py-2.5 rounded-xl text-sm font-bold font-mono outline-none text-white transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={clockActionLoading}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-neutral-950 font-extrabold py-3 rounded-xl transition-all duration-200 shadow-md shadow-amber-950/40 flex items-center justify-center gap-2"
                    >
                      {clockActionLoading ? (
                        <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        "Advance & Run Sweep"
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Clock Result Log */}
              <div className="lg:col-span-2 bg-neutral-900 border border-neutral-850 p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-500" />
                  Clock Sweep Results Log
                </h3>

                {clockActionResult ? (
                  <div className="space-y-4 text-sm text-neutral-350">
                    <div className="flex justify-between items-center bg-neutral-950 border border-neutral-850 p-3 rounded-xl">
                      <span>Advanced Days:</span>
                      <strong className="text-white">{clockActionResult.advancedDays}</strong>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-950 border border-neutral-850 p-3 rounded-xl">
                      <span>Simulated Now:</span>
                      <strong className="text-neutral-200 font-mono">
                        {new Date(clockActionResult.simulatedTime).toLocaleString("id-ID")}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center bg-neutral-950 border border-neutral-850 p-3 rounded-xl">
                      <span>Swept Overdue Orders:</span>
                      <strong className={`font-bold font-mono ${clockActionResult.sweptOrdersCount > 0 ? "text-emerald-400" : "text-neutral-400"}`}>
                        {clockActionResult.sweptOrdersCount} order(s)
                      </strong>
                    </div>
                    {clockActionResult.sweptOrdersCount > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider block">Processed Order IDs:</span>
                        <div className="max-h-36 overflow-y-auto bg-neutral-950 border border-neutral-850 p-3 rounded-xl font-mono text-xs text-neutral-450 divide-y divide-neutral-900">
                          {clockActionResult.sweptOrderIds.map((id: string, idx: number) => (
                            <div key={idx} className="py-1 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>{id}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
                    <HelpCircle className="w-10 h-10 text-neutral-600" />
                    <p className="text-neutral-500 font-semibold text-sm">No recent time travel actions executed</p>
                    <p className="text-xs text-neutral-600 max-w-sm leading-relaxed">
                      Advance the simulated clock to trigger the SLA overdue checks, auto-returns, refunds, and driver job cancellations.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
