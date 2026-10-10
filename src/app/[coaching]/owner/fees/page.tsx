"use client";

import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { listFees } from "@/lib/data";
import type { FeeEntry } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Wallet, AlertTriangle } from "lucide-react";

export default function FeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeEntry[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    if (!user?.tenantId) return;
    try {
      setError("");
      setFees(await listFees(user.tenantId));
    } catch {
      setError("Fee records could not be loaded right now.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenantId]);

  async function toggle(fee: FeeEntry) {
    setBusyId(fee.id);
    try {
      const markFeeStatus = httpsCallable(functions, "markFeeStatus");
      await markFeeStatus({ feeId: fee.id, status: fee.status === "paid" ? "due" : "paid" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (!fees && error) return <ErrorState body={error} action={<Button onClick={load}>Try again</Button>} />;
  if (!fees) return <p className="text-sm text-ink-soft">Loading…</p>;

  const due = fees.filter((f) => f.status === "due");
  const dueTotal = due.reduce((sum, f) => sum + f.amount, 0);
  const paidTotal = fees.filter((f) => f.status === "paid").reduce((sum, f) => sum + f.amount, 0);

  return (
    <div>
      <PageHeader eyebrow="Owner" title="Fees" description="Mark payments as they come in — no gateway needed yet." />

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <StatCard label="Collected" value={`৳${paidTotal.toLocaleString()}`} icon={<Wallet size={16} />} />
        <StatCard label="Outstanding" value={`৳${dueTotal.toLocaleString()}`} icon={<AlertTriangle size={16} />} hint={`${due.length} entries due`} />
      </div>

      {fees.length === 0 ? (
        <EmptyState title="No fee entries yet" body="Fee entries appear here once you set up billing for a student." />
      ) : (
        <StampCard padded={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold">Month</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {fees.map((f) => (
                <tr key={f.id}>
                  <td className="px-5 py-3.5 font-medium text-ink">{f.studentName}</td>
                  <td className="px-5 py-3.5 font-tabular text-ink-soft">{f.month}</td>
                  <td className="px-5 py-3.5 font-tabular text-ink-soft">৳{f.amount}</td>
                  <td className="px-5 py-3.5"><Badge tone={f.status === "paid" ? "board" : "red"}>{f.status}</Badge></td>
                  <td className="px-5 py-3.5 text-right">
                    <Button variant="secondary" size="sm" disabled={busyId === f.id} onClick={() => toggle(f)}>Mark {f.status === "paid" ? "due" : "paid"}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </StampCard>
      )}
    </div>
  );
}
