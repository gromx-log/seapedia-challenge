"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ShoppingCart, Wallet, User, LogOut, ChevronDown, RefreshCw } from "lucide-react";

export default function Navbar() {
  const { user, logout, refreshUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleRoleSwitch = async (targetRole: string) => {
    if (!user || user.activeRole === targetRole) return;
    setSwitching(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/switch-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: targetRole }),
        credentials: "include",
      });

      if (res.ok) {
        await refreshUser();
        // Redirect to new dashboard
        window.location.href = `/dashboard/${targetRole.toLowerCase()}`;
      } else {
        alert("Failed to switch role");
      }
    } catch (error) {
      console.error("Error switching role:", error);
    } finally {
      setSwitching(false);
      setDropdownOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800 text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent hover:scale-105 transition-transform duration-200">
              SEAPEDIA
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/products" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                Catalog
              </Link>
              {user?.activeRole === "BUYER" && (
                <Link href="/dashboard/buyer/cart" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4" />
                  Cart
                </Link>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {/* Wallet Balance (For Buyer) */}
                {user.activeRole === "BUYER" && (
                  <Link href="/dashboard/buyer/wallet" className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded-full text-sm font-semibold text-emerald-400 hover:border-emerald-500 hover:bg-emerald-950/20 transition-all duration-200">
                    <Wallet className="w-4 h-4" />
                    <span>{formatCurrency(user.walletBalance)}</span>
                  </Link>
                )}

                {/* Profile / Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    <User className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-200">{user.username}</span>
                    <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md uppercase font-bold">
                      {user.activeRole}
                    </span>
                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3 py-2 border-b border-neutral-800 mb-1">
                        <p className="text-xs text-neutral-500 font-semibold uppercase">My Accounts</p>
                        <p className="text-sm font-medium text-neutral-200 truncate">{user.email}</p>
                      </div>

                      {/* Dashboard Link */}
                      <Link
                        href={`/dashboard/${user.activeRole.toLowerCase()}`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition-all duration-200"
                      >
                        <User className="w-4 h-4" />
                        Go to Dashboard
                      </Link>

                      {/* Multi-role Selector */}
                      {user.roles.length > 1 && (
                        <div className="px-3 py-2 border-t border-neutral-800 mt-2">
                          <p className="text-xs text-neutral-500 font-semibold uppercase mb-1.5 flex items-center gap-1">
                            {switching ? <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" /> : null}
                            Switch Active Role
                          </p>
                          <div className="flex flex-col gap-1">
                            {user.roles.map((r) => (
                              <button
                                key={r}
                                disabled={switching || user.activeRole === r}
                                onClick={() => handleRoleSwitch(r)}
                                className={`w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all duration-200 ${
                                  user.activeRole === r
                                    ? "bg-indigo-950/40 text-indigo-400 border border-indigo-900/60"
                                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent"
                                }`}
                              >
                                {r}
                                {user.activeRole === r && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Logout */}
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-xl mt-2 border-t border-neutral-800 pt-2 transition-all duration-200"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors px-4 py-2">
                  Sign In
                </Link>
                <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl transition-all duration-200 shadow-md shadow-indigo-900/20">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
