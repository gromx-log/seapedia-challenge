"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, TrendingUp, Tag, ClipboardCheck, Calendar } from "lucide-react";

interface OrderTx {
  id: string;
  buyerName: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  createdAt: string;
  status: string;
}

interface IncomeReport {
  totalIncome: number;
  totalDiscountGiven: number;
  totalDeliveryFee: number;
  totalPpn: number;
  ordersCount: number;
  monthlyBreakdown: { month: string; amount: number }[];
  orders: OrderTx[];
}

export default function SellerIncomeReportPage() {
  const [report, setReport] = useState<IncomeReport | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchReport = async () => {
    try {
      const res = await fetch(`${API_URL}/api/seller/reports/income`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

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
        Compiling earnings statements...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex-1 bg-neutral-950 px-4 py-12 flex flex-col items-center justify-center gap-4 text-neutral-400">
        <BarChart3 className="w-12 h-12 text-rose-500" />
        <p>Failed to compile earnings reports.</p>
        <Link href="/dashboard/seller" className="text-indigo-400 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-1">
          <Link href="/dashboard/seller" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-indigo-400" />
            Income Report
          </h1>
          <p className="text-xs text-neutral-400">Track total revenue, store product sales, and checkouts statements</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Total Revenue */}
          <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Gross Sales</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-4">{formatCurrency(report.totalIncome)}</div>
            <p className="text-[10px] text-neutral-500 mt-2">Cumulative product sales value</p>
          </div>

          {/* Discounts Given */}
          <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Discounts Absorbed</span>
              <Tag className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-purple-400 mt-4">{formatCurrency(report.totalDiscountGiven)}</div>
            <p className="text-[10px] text-neutral-500 mt-2">Promos and vouchers total discounts</p>
          </div>

          {/* Orders Count */}
          <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Checkouts Handled</span>
              <ClipboardCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-4">{report.ordersCount} checkouts</div>
            <p className="text-[10px] text-neutral-500 mt-2">Total incoming checkout count</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Monthly breakdown */}
          <div className="lg:col-span-4 bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Monthly Breakdown</h3>
              <p className="text-[10px] text-neutral-500">Gross sales aggregated by month</p>
            </div>

            {report.monthlyBreakdown.length === 0 ? (
              <div className="text-neutral-500 text-xs italic text-center py-6">No data available.</div>
            ) : (
              <div className="space-y-3">
                {report.monthlyBreakdown.map((row) => (
                  <div key={row.month} className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300">{row.month}</span>
                    <span className="text-sm font-extrabold text-white">{formatCurrency(row.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaction Statement list */}
          <div className="lg:col-span-8 bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Transaction Statements</h3>
              <p className="text-[10px] text-neutral-500">Log of incoming checkouts sales</p>
            </div>

            {report.orders.length === 0 ? (
              <div className="text-neutral-500 text-xs italic text-center py-6">No transactions recorded.</div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {report.orders.map((o) => {
                  const netProductSales = o.subtotal - o.discountAmount;
                  return (
                    <div key={o.id} className="bg-neutral-950 border border-neutral-850 p-5 rounded-2xl space-y-3 hover:border-neutral-800 transition-colors">
                      <div className="flex items-center justify-between border-b border-neutral-850/60 pb-2">
                        <div className="font-bold text-white text-sm">Buyer: {o.buyerName}</div>
                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-neutral-600" />
                          {new Date(o.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-neutral-400">
                        <div>
                          <span>Subtotal Price</span>
                          <p className="text-xs font-bold text-neutral-200 mt-0.5">{formatCurrency(o.subtotal)}</p>
                        </div>
                        <div>
                          <span>Discount Given</span>
                          <p className="text-xs font-bold text-purple-400 mt-0.5">-{formatCurrency(o.discountAmount)}</p>
                        </div>
                        <div>
                          <span>Checkout Status</span>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase mt-1">{o.status}</p>
                        </div>
                        <div className="text-right">
                          <span>Store Earnings</span>
                          <p className="text-xs font-extrabold text-emerald-400 mt-0.5">+{formatCurrency(netProductSales)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
