"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listTenants } from "@/lib/data";
import type { Tenant } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
export default function OperationsPage() {
  const [rows, setRows] = useState<Array<Tenant & { users: number; students: number; teachers: number }>>([]);
  useEffect(() => { listTenants().then(async (tenants) => setRows(await Promise.all(tenants.map(async (tenant) => { const [u, s, t] = await Promise.all(["users", "students", "teachers"].map((name) => getDocs(collection(db, "tenants", tenant.id, name)))); return { ...tenant, users: u.size, students: s.size, teachers: t.size }; })))); }, []);
  return <div><PageHeader eyebrow="Super admin" title="Operations" description="Cross-tenant health and usage visibility for support and launch operations." /><StampCard padded={false}><div className="divide-y divide-rule">{rows.map((row) => <div key={row.id} className="grid gap-2 px-5 py-4 sm:grid-cols-4"><div><p className="font-semibold text-ink">{row.name}</p><p className="text-xs text-ink-faint">/{row.slug}</p></div><span className="text-sm text-ink-soft">{row.users} users</span><span className="text-sm text-ink-soft">{row.students} students</span><span className="text-sm text-ink-soft">{row.teachers} teachers · {row.status}</span></div>)}</div></StampCard></div>;
}
