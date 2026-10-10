"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/lib/types";

export function RouteGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || !user.role || !allow.includes(user.role)) {
      router.replace("/login");
    }
  }, [loading, user, allow, router]);

  if (loading || !user || !user.role || !allow.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="flex items-center gap-2 text-ink-soft">
          <span className="h-2 w-2 animate-pulse rounded-full bg-board" />
          <span className="text-sm font-medium">Checking your roll number…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
