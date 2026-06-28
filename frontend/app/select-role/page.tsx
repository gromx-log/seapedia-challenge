"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, ArrowRight, User } from "lucide-react";

interface PreAuthData {
  preAuthToken: string;
  roles: string[];
  username: string;
}

export default function SelectRolePage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [preAuth, setPreAuth] = useState<PreAuthData | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    const raw = sessionStorage.getItem("preAuth");
    if (!raw) {
      router.push("/login");
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PreAuthData;
      setPreAuth(parsed);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  const handleSelectRole = async () => {
    if (!preAuth || !selectedRole) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/select-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preAuthToken: preAuth.preAuthToken,
          role: selectedRole,
        }),
        credentials: "include", // Set session cookie
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Role selection failed");
      }

      await refreshUser();
      sessionStorage.removeItem("preAuth");
      router.push(`/dashboard/${selectedRole.toLowerCase()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!preAuth) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-400">
        Loading pre-auth session...
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-radial from-neutral-900 to-neutral-950">
      <div className="max-w-md w-full space-y-8 bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div>
          <div className="flex justify-center">
            <div className="p-3 bg-indigo-950/50 border border-indigo-900/60 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold font-serif text-white tracking-tight">
            Select Active Role
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-400">
            Welcome back, <span className="text-neutral-200 font-semibold">{preAuth.username}</span>. Pick a role for this session.
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 text-sm text-rose-400 animate-pulse">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div className="flex flex-col gap-3">
            {preAuth.roles.map((role) => {
              const isSelected = selectedRole === role;
              return (
                <button
                  type="button"
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full flex items-center justify-between p-5 border rounded-2xl transition-all duration-200 ${
                    isSelected
                      ? "bg-indigo-950/40 border-indigo-500 text-indigo-400 shadow-md shadow-indigo-500/10"
                      : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className={`w-5 h-5 ${isSelected ? "text-indigo-400" : "text-neutral-500"}`} />
                    <span className="font-bold tracking-wide uppercase">{role}</span>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${
                    isSelected ? "translate-x-1 text-indigo-400" : "text-neutral-600"
                  }`} />
                </button>
              );
            })}
          </div>

          <div>
            <button
              onClick={handleSelectRole}
              disabled={!selectedRole || loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-indigo-900/30 cursor-pointer"
            >
              {loading ? "Activating Role..." : "Confirm Active Role"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
