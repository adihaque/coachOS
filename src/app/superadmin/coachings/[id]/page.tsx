"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { getTenant } from "@/lib/data";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Tenant } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select, FormRow, Label } from "@/components/ui/Field";
import { Users, Wallet, ShieldOff, ShieldCheck } from "lucide-react";

export default function CoachingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<Tenant["plan"]>("starter");
  const [metrics, setMetrics] = useState({ users: 0, teachers: 0, students: 0, guardians: 0, audit: 0 });

  async function load() {
    const t = await getTenant(id);
    setTenant(t);
    if (t) setPlan(t.plan);
    const names = ["users", "teachers", "students", "guardians", "auditLogs"] as const;
    const counts = await Promise.all(names.map((name) => getDocs(collection(db, "tenants", id, name))));
    setMetrics({ users: counts[0].size, teachers: counts[1].size, students: counts[2].size, guardians: counts[3].size, audit: counts[4].size });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleStatus() {
    if (!tenant) return;
    setBusy(true);
    try {
      const fn = httpsCallable(functions, tenant.status === "suspended" ? "activateTenant" : "suspendTenant");
      await fn({ tenantId: tenant.id });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function updatePlanForTenant() {
    if (!tenant) return;
    setBusy(true);
    try {
      const fn = httpsCallable(functions, "updateTenantPlan");
      await fn({ tenantId: tenant.id, plan });
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!tenant) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div>
      <PageHeader eyebrow="Super admin" title={tenant.name} description={`/${tenant.slug} · created ${new Date(tenant.createdAt).toLocaleDateString()}`}
        action={
          <Button variant={tenant.status === "suspended" ? "primary" : "danger"} onClick={toggleStatus} disabled={busy}
            icon={tenant.status === "suspended" ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}>
            {tenant.status === "suspended" ? "Activate coaching" : "Suspend coaching"}
          </Button>
        } />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Status" value={tenant.status} icon={<Badge tone={tenant.status === "active" ? "board" : tenant.status === "trial" ? "chalk" : "red"}>{tenant.status}</Badge>} />
        <StatCard label="Students" value={`${tenant.studentCount || 0} / ${tenant.studentLimit}`} icon={<Users size={16} />} />
        <StatCard label="Plan" value={tenant.plan} icon={<Wallet size={16} />} />
      </div>
      <StampCard className="mb-5"><h3 className="mb-4 font-display text-base font-semibold text-ink">Operational visibility</h3><div className="grid gap-3 sm:grid-cols-5">{Object.entries(metrics).map(([label, value]) => <div key={label}><p className="text-xs uppercase text-ink-faint">{label}</p><p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p></div>)}</div><p className="mt-4 text-xs text-ink-soft">Counts are read through superadmin-authorized tenant access. Status changes are logged server-side.</p></StampCard>

      <StampCard className="mb-5">
        <h3 className="mb-4 font-display text-base font-semibold text-ink">Plan management</h3>
        <FormRow>
          <Label htmlFor="tenantPlan">Subscription tier</Label>
          <Select id="tenantPlan" value={plan} onChange={(e) => setPlan(e.target.value as Tenant["plan"])}>
            <option value="starter">Starter</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </Select>
        </FormRow>
        <Button onClick={updatePlanForTenant} disabled={busy || plan === tenant.plan}>{busy ? "Updating…" : "Update plan"}</Button>
      </StampCard>

      <StampCard>
        <h3 className="mb-4 font-display text-base font-semibold text-ink">Owner</h3>
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-ink-faint">Name</dt><dd className="text-ink">{tenant.ownerName}</dd>
          <dt className="text-ink-faint">Email</dt><dd className="text-ink">{tenant.ownerEmail}</dd>
        </dl>
      </StampCard>
    </div>
  );
}
