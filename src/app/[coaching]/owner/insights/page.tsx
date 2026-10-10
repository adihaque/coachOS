"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listStudents, listFees, listAttendance, listHomework, buildInsights } from "@/lib/data";
import type { Insight } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
export default function InsightsPage() {
  const { user } = useAuth(); const [items, setItems] = useState<Insight[]>([]);
  useEffect(() => { if (!user?.tenantId) return; Promise.all([listStudents(user.tenantId), listFees(user.tenantId), listAttendance(user.tenantId), listHomework(user.tenantId)]).then(([s, f, a, h]) => setItems(buildInsights(s, f, a, h))); }, [user?.tenantId]);
  return <div><PageHeader eyebrow="Owner" title="Explainable insights" description="Deterministic signals from attendance, fees, and homework—not predictions or hidden AI." /><div className="space-y-4">{items.map((item) => <StampCard key={item.id}><div className="flex justify-between gap-4"><div><h2 className="font-display font-semibold text-ink">{item.title}</h2><p className="mt-1 text-sm text-ink-soft">{item.detail}</p><p className="mt-2 font-tabular text-xs text-ink-faint">Source: {item.source} · Confidence {Math.round(item.confidence * 100)}%</p></div><span className="text-xs uppercase text-board">{item.severity}</span></div></StampCard>)}{!items.length && <StampCard><p className="text-sm text-ink-soft">No risk signals found.</p></StampCard>}</div></div>;
}
