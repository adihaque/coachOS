"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listPayments } from "@/lib/data";
import type { PaymentTransaction } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
export default function PaymentsPage() {
  const { user } = useAuth(); const [rows, setRows] = useState<PaymentTransaction[]>([]);
  useEffect(() => { if (user?.tenantId) listPayments(user.tenantId).then(setRows); }, [user?.tenantId]);
  return <div><PageHeader eyebrow="Owner" title="Payment transactions" description="Manual transaction IDs are supported now; gateway adapters remain disabled until credentials are configured." /><StampCard padded={false}><div className="divide-y divide-rule">{rows.map((row) => <div key={row.id} className="flex flex-wrap justify-between gap-3 px-5 py-4 text-sm"><span className="font-tabular">{row.reference}</span><span>{row.provider} · ৳{row.amount}</span><span className="uppercase text-xs text-ink-soft">{row.status}</span></div>)}{!rows.length && <p className="p-6 text-sm text-ink-soft">No payment transactions yet.</p>}</div></StampCard></div>;
}
