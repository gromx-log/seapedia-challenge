"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Wallet, Plus, Calendar, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  createdAt: string;
}

export default function BuyerWalletPage() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topupAmount, setTopupAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/buyer/wallet/transactions`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const amount = Number(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid positive top up amount");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/buyer/wallet/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Top up failed");
      }

      setSuccess(`Successfully topped up ${formatCurrency(amount)}!`);
      setTopupAmount("");
      await refreshUser(); // Update balance in context
      fetchTransactions(); // Reload list
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 bg-neutral-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="space-y-1">
          <Link href="/dashboard/buyer" className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-white font-serif tracking-tight flex items-center gap-2">
            <Wallet className="w-8 h-8 text-indigo-400" />
            Wallet Manager
          </h1>
          <p className="text-xs text-neutral-400">Manage balances and review transaction statements</p>
        </div>

        {/* Global Notifications */}
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Balance + Topup Form */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-indigo-900/80 to-purple-950/80 border border-indigo-850 p-6 rounded-3xl relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="space-y-4">
                <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Current Balance</span>
                <div className="text-3xl font-extrabold text-white">{formatCurrency(user.walletBalance)}</div>
                <div className="text-[10px] text-indigo-300">Fast, secure local digital currency</div>
              </div>
            </div>

            {/* Topup Form */}
            <div className="bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1">
                <Plus className="w-4 h-4 text-indigo-400" />
                Dummy Top Up
              </h3>
              
              <form onSubmit={handleTopup} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Amount (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="E.g. 50000"
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-2xl transition-colors cursor-pointer"
                >
                  {submitting ? "Processing..." : "Top Up Now"}
                </button>
              </form>
            </div>

          </div>

          {/* Right panel: Statements */}
          <div className="lg:col-span-8 bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white font-serif">Statement Summary</h3>
              <p className="text-xs text-neutral-500">Chronological history of credits and debits</p>
            </div>

            {loading ? (
              <div className="h-64 bg-neutral-950 border border-neutral-850 rounded-2xl animate-pulse"></div>
            ) : transactions.length === 0 ? (
              <div className="bg-neutral-950/40 border border-neutral-850/60 p-12 text-center rounded-2xl text-neutral-500 text-xs italic">
                No transactions recorded yet.
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                {transactions.map((tx) => {
                  const isTopup = tx.type === "TOPUP";
                  return (
                    <div
                      key={tx.id}
                      className="bg-neutral-950 border border-neutral-850 p-4 rounded-2xl flex items-center justify-between hover:border-neutral-800 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${
                          isTopup 
                            ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30" 
                            : "bg-rose-950/20 text-rose-400 border-rose-900/30"
                        }`}>
                          {isTopup ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>

                        <div>
                          <span className="text-xs font-bold text-white block">{tx.note || (isTopup ? "Deposit" : "Payment")}</span>
                          <span className="text-[10px] text-neutral-500 flex items-center gap-1 uppercase tracking-wider font-semibold mt-1">
                            <Calendar className="w-3 h-3 text-neutral-600" />
                            {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <span className={`font-extrabold text-sm ${isTopup ? "text-emerald-400" : "text-neutral-300"}`}>
                        {isTopup ? "+" : "-"}{formatCurrency(tx.amount)}
                      </span>
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
