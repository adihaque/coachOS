"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listTenants } from "@/lib/data";
import type { Tenant } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Search } from "lucide-react";

export default function CoachingsPage() {
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [q, setQ] = useState("");
  const router = useRouter();

  useEffect(() => {
    listTenants().then(setTenants).catch(() => setTenants([]));
  }, []);

  if (!tenants) return <p className="text-sm text-ink-soft">Loading…</p>;

  const filtered = tenants.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()) || t.slug.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader eyebrow="Super admin" title="Coaching centers" description="Every tenant on the platform."
        action={<Button href="/superadmin/coachings/new" icon={<Plus size={16} />}>Add coaching</Button>} />

      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <Input placeholder="Search by name or slug…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No coachings found" body="Try a different search, or add a new coaching center." />
      ) : (
        <StampCard padded={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-semibold">Coaching</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">Students</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filtered.map((t) => (
                <tr key={t.id} className="cursor-pointer hover:bg-[var(--board-tint)]" onClick={() => router.push(`/superadmin/coachings/${t.id}`)}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-ink">{t.name}</p>
                    <p className="font-tabular text-xs text-ink-faint">/{t.slug}</p>
                  </td>
                  <td className="px-5 py-3.5 capitalize text-ink-soft">{t.plan}</td>
                  <td className="px-5 py-3.5 font-tabular text-ink-soft">{t.studentCount || 0} / {t.studentLimit}</td>
                  <td className="px-5 py-3.5"><Badge tone={t.status === "active" ? "board" : t.status === "trial" ? "chalk" : "red"}>{t.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </StampCard>
      )}
    </div>
  );
}
