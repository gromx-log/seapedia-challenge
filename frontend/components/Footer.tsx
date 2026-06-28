"use client";

import React from "react";

export default function Footer() {
  return (
    <footer className="bg-neutral-950 border-t border-neutral-900 py-6 text-center text-neutral-500 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <p className="font-semibold text-neutral-400">
          SEAPEDIA &copy; {new Date().getFullYear()} — COMPFEST 18 SEA Academy Challenge
        </p>
        <p className="text-xs text-neutral-600 mt-1">
          Designed with absolute excellence. Built for solo execution.
        </p>
      </div>
    </footer>
  );
}
