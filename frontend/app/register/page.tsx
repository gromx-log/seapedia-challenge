"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, User, Mail, Lock, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const handleRoleChange = (role: string) => {
    if (roles.includes(role)) {
      setRoles(roles.filter((r) => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (roles.length === 0) {
      setError("Please select at least one role.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, roles }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // If registered and logged in immediately
      if (data.user?.activeRole) {
        await refreshUser();
        router.push(`/dashboard/${data.user.activeRole.toLowerCase()}`);
      } else {
        // Multi-role, needs login first
        router.push("/login?registered=true");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-radial from-neutral-900 to-neutral-950">
      <div className="max-w-md w-full space-y-8 bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div>
          <div className="flex justify-center">
            <div className="p-3 bg-indigo-950/50 border border-indigo-900/60 rounded-2xl">
              <UserPlus className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold font-serif text-white tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-400">
            Join the SEAPEDIA multi-role marketplace
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 text-sm text-rose-400 animate-pulse">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-3 pl-10 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                  placeholder="john_doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-3 pl-10 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                  placeholder="john@example.com"
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
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl py-3 pl-10 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Role Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                Select Your Role(s)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["BUYER", "SELLER", "DRIVER"].map((role) => {
                  const isChecked = roles.includes(role);
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      className={`flex flex-col items-center justify-center p-4 border rounded-2xl transition-all duration-200 gap-1.5 ${
                        isChecked
                          ? "bg-indigo-950/40 border-indigo-500 text-indigo-400 shadow-md shadow-indigo-500/10"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <ShieldCheck className={`w-5 h-5 ${isChecked ? "text-indigo-400" : "text-neutral-500"}`} />
                      <span className="text-xs font-bold uppercase tracking-wide">{role}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-neutral-500 mt-2 italic text-center">
                *Note: You can select multiple roles and switch between them inside your session.
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-indigo-900/30 cursor-pointer"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-neutral-400">Already have an account? </span>
            <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
