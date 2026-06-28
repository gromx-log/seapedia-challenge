"use client";

import React from "react";
import { Truck, Sparkles } from "lucide-react";

export default function DriverDashboardPlaceholder() {
  return (
    <div className="flex-1 bg-neutral-950 px-4 py-12 flex items-center justify-center">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-850 p-8 rounded-3xl text-center space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex justify-center">
          <div className="p-4 bg-indigo-950/40 border border-indigo-900/40 text-indigo-400 rounded-2xl">
            <Truck className="w-10 h-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white font-serif tracking-tight">Driver Dashboard</h1>
          <span className="inline-block text-[10px] font-bold bg-neutral-950 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded uppercase tracking-wider">
            Coming Soon (Level 5)
          </span>
        </div>

        <p className="text-sm text-neutral-400 leading-relaxed italic">
          Accepting delivery jobs, tracking orders, and updating completion status is currently out of scope for today's Level 1-4 build.
        </p>

        <div className="border-t border-neutral-850 pt-6 flex items-center justify-center gap-2 text-xs text-neutral-500 font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>STAY TUNED FOR LEVEL 5 INTEGRATION</span>
        </div>
      </div>
    </div>
  );
}
