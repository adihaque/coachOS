"use client";

import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { useTenant } from "@/lib/tenant-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Label, FormRow, Select } from "@/components/ui/Field";

const PLAN_DETAILS: Record<string, { price: string; cap: string }> = {
  starter: { price: "৳1,500/mo", cap: "up to 200 students" },
  standard: { price: "৳3,500/mo", cap: "up to 1,000 students" },
  premium: { price: "Custom", cap: "unlimited students" },
};

export default function SubscriptionPage() {
  const { tenant, refreshTenant } = useTenant();
  const [selectedPlan, setSelectedPlan] = useState<string>(tenant?.plan ?? "starter");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!tenant) return <p className="text-sm text-ink-soft">Loading…</p>;

  const plan = PLAN_DETAILS[tenant.plan];
  const usage = tenant.studentLimit ? Math.min(100, ((tenant.studentCount || 0) / tenant.studentLimit) * 100) : 0;
  const nearLimit = usage >= 80;

  async function updatePlan() {
    setSaving(true);
    setError(null);
    try {
      const fn = httpsCallable(functions, "updateTenantPlan");
      await fn({ plan: selectedPlan });
      await refreshTenant();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to change the plan.";
      setError(message.replace(/^Firebase:\s*/, ""));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader eyebrow="Owner" title="Subscription" />
      <StampCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-semibold capitalize text-ink">{tenant.plan} plan</p>
            <p className="text-sm text-ink-soft">{plan.cap}</p>
          </div>
          <Badge tone={tenant.status === "active" ? "board" : tenant.status === "trial" ? "chalk" : "red"}>{tenant.status}</Badge>
        </div>
        <p className="mt-4 font-display text-2xl font-semibold text-ink">{plan.price}</p>
        <p className="mt-1 text-sm text-ink-soft">{tenant.studentCount || 0} / {tenant.studentLimit} students used</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-board-tint" aria-label={`${Math.round(usage)} percent of student limit used`}>
          <div className={`h-full rounded-full ${nearLimit ? "bg-red-pen" : "bg-board"}`} style={{ width: `${usage}%` }} />
        </div>
        {nearLimit && <p className="mt-2 text-xs font-medium text-red-pen">You are close to this plan&apos;s student limit. Upgrade before adding more learners.</p>}

        <div className="mt-6 space-y-4">
          <FormRow>
            <Label htmlFor="plan">Upgrade or downgrade</Label>
            <Select id="plan" value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}>
              <option value="starter">Starter</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </Select>
          </FormRow>
          <Button onClick={updatePlan} disabled={saving || selectedPlan === tenant.plan}>{saving ? "Updating…" : "Update plan"}</Button>
          {error && <p className="text-sm text-red-pen">{error}</p>}
        </div>

        <div className="mt-5 rounded-lg border border-rule bg-paper p-3 text-xs text-ink-soft">
          Billing is handled manually while CoachOS is in early access — reach out to your CoachOS contact to change plans or update payment details.
        </div>
      </StampCard>
    </div>
  );
}
