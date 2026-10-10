"use client";

import { ReactNode } from "react";
import { TenantProvider, useTenant } from "@/lib/tenant-context";

function TenantGate({ children }: { children: ReactNode }) {
  const { tenant, loading } = useTenant();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-paper"><span className="text-sm text-ink-soft">Loading coaching…</span></div>;
  }

  if (!tenant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-paper text-center">
        <h1 className="font-display text-xl font-semibold text-ink">Coaching not found</h1>
        <p className="text-sm text-ink-soft">Check the web address and try again.</p>
      </div>
    );
  }

  if (tenant.status === "suspended") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-paper text-center">
        <h1 className="font-display text-xl font-semibold text-ink">This coaching is paused</h1>
        <p className="max-w-sm text-sm text-ink-soft">{tenant.name}&apos;s subscription is currently inactive. Contact CoachOS support to reactivate it.</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function CoachingLayout({ children }: { children: ReactNode }) {
  return (
    <TenantProvider>
      <TenantGate>{children}</TenantGate>
    </TenantProvider>
  );
}
