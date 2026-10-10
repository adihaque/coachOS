"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listFees } from "@/lib/data";
import type { FeeEntry } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Wallet } from "lucide-react";

export default function StudentFeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeEntry[] | null>(null);

  useEffect(() => {
    if (!user?.tenantId || !user.uid) return;
    listFees(user.tenantId, user.uid).then(setFees);
  }, [user?.tenantId, user?.uid]);

  if (!fees) return <p className="text-sm text-ink-soft">Loading…</p>;

  const due = fees.filter((f) => f.status === "due");
  const dueTotal = due.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div>
      <PageHeader eyebrow="Student" title="My fees" />

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <StatCard label="Outstanding" value={`৳${dueTotal.toLocaleString()}`} icon={<Wallet size={16} />} hint={`${due.length} due`} />
        <StatCard label="Total entries" value={String(fees.length)} />
      </div>

      {fees.length === 0 ? (
        <EmptyState title="No fee entries yet" body="Your fee history will appear here once your coaching sets it up." />
      ) : (
        <StampCard padded={false}>
          <div className="divide-y divide-rule">
            {fees.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="font-tabular text-ink">{f.month}</span>
                <span className="font-tabular text-ink-soft">৳{f.amount}</span>
                <Badge tone={f.status === "paid" ? "board" : "red"}>{f.status}</Badge>
              </div>
            ))}
          </div>
        </StampCard>
      )}
    </div>
  );
}
