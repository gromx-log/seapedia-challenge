"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.activeRole !== "DRIVER") {
        router.push(`/dashboard/${user.activeRole.toLowerCase()}`);
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.activeRole !== "DRIVER") {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-400">
        Loading dashboard profile...
      </div>
    );
  }

  return <>{children}</>;
}
