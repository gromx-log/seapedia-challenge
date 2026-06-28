"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogIn, User, Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMsg("Registration successful! Please login below.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Essential for setting cookies cross-origin/port
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.requiresRoleSelection) {
        // Multi-role user, store pre-auth token and redirect to select-role
        sessionStorage.setItem("preAuth", JSON.stringify({
          preAuthToken: data.preAuthToken,
          roles: data.roles,
          username,
        }));
        router.push("/select-role");
      } else {
        // Single role or admin, cookie is set, refresh user state and redirect
        await refreshUser();
        const role = data.user.activeRole.toLowerCase();
        router.push(`/dashboard/${role}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {successMsg && (
        <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4 text-sm text-emerald-400 animate-in fade-in duration-200">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 text-sm text-rose-400 animate-pulse">
          {error}
        </div>
      )}

      <div className="space-y-4 rounded-md shadow-sm">
        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-850 rounded-2xl py-3 pl-10 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
              placeholder="admin, seller1, buyer1"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-850 rounded-2xl py-3 pl-10 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-650 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-indigo-900/30 cursor-pointer"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </div>

      <div className="text-center text-sm">
        <span className="text-neutral-400">Don't have an account? </span>
        <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
          Register Here
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-radial from-neutral-900 to-neutral-950">
      <div className="max-w-md w-full space-y-8 bg-neutral-900 border border-neutral-880 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div>
          <div className="flex justify-center">
            <div className="p-3 bg-blue-950/50 border border-blue-900/60 rounded-2xl">
              <LogIn className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold font-serif text-white tracking-tight">
            Sign in to SEAPEDIA
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-400">
            Access your marketplace dashboard
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-xs text-neutral-500 py-6">Loading form...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
