"use client";

import { useEffect, useState } from "react";
import { listTenants } from "@/lib/data";
import type { Tenant } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Building2, Users, TrendingUp, Plus } from "lucide-react";

const PLAN_PRICE: Record<Tenant["plan"], number> = { starter: 1500, standard: 3500, premium: 8000 };

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[] | null>(null);

  useEffect(() => {
    listTenants().then(setTenants).catch(() => setTenants([]));
  }, []);

  if (!tenants) return <p className="text-sm text-ink-soft">Loading…</p>;

  const active = tenants.filter((t) => t.status === "active");
  const mrr = active.reduce((sum, t) => sum + PLAN_PRICE[t.plan], 0);
  const totalStudents = tenants.reduce((sum, t) => sum + (t.studentCount || 0), 0);

  return (
    <div>
      <PageHeader eyebrow="Super admin" title="Every coaching, one screen" description="Onboard new coaching centers and keep an eye on the ones already live."
        action={<Button href="/superadmin/coachings/new" icon={<Plus size={16} />}>Add coaching</Button>} />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Coaching centers" value={String(tenants.length)} icon={<Building2 size={16} />} hint={`${active.length} active`} />
        <StatCard label="Monthly revenue" value={`৳${mrr.toLocaleString()}`} icon={<TrendingUp size={16} />} hint="from active plans" />
        <StatCard label="Total students" value={totalStudents.toLocaleString()} icon={<Users size={16} />} hint="across all coachings" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Recent coachings</h2>
        <Button href="/superadmin/coachings" variant="ghost" size="sm">View all</Button>
      </div>

      {tenants.length === 0 ? (
        <EmptyState title="No coachings yet" body="Onboard your first coaching center to get them up and running."
          action={<Button href="/superadmin/coachings/new" icon={<Plus size={16} />}>Add coaching</Button>} />
      ) : (
        <StampCard padded={false}>
          <div className="divide-y divide-rule">
            {tenants.slice(0, 6).map((t) => (
              <a key={t.id} href={`/superadmin/coachings/${t.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--board-tint)]">
                <div>
                  <p className="font-semibold text-ink">{t.name}</p>
                  <p className="font-tabular text-xs text-ink-faint">/{t.slug} · {t.studentCount || 0} students</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="neutral">{t.plan}</Badge>
                  <Badge tone={t.status === "active" ? "board" : t.status === "trial" ? "chalk" : "red"}>{t.status}</Badge>
                </div>
              </a>
            ))}
          </div>
        </StampCard>
      )}
    </div>
  );
}
