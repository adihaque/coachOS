"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listStudents } from "@/lib/data";
import type { Student } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Plus, Search, ArrowDownAZ, ArrowUpAZ } from "lucide-react";

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [batch, setBatch] = useState("all");
  const [sortAsc, setSortAsc] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!user?.tenantId) return;
    setError("");
    listStudents(user.tenantId).then(setStudents).catch(() => setError("Students could not be loaded right now."));
  }, [user?.tenantId]);

  if (!students && error) return <ErrorState body={error} action={<Button onClick={() => window.location.reload()}>Try again</Button>} />;
  if (!students) return <p className="text-sm text-ink-soft">Loading…</p>;

  const filtered = students
    .filter((s) => (s.name.toLowerCase().includes(q.toLowerCase()) || s.roll.toLowerCase().includes(q.toLowerCase()) || s.guardianName.toLowerCase().includes(q.toLowerCase()) || s.guardianPhone.includes(q)))
    .filter((s) => status === "all" || s.status === status)
    .filter((s) => batch === "all" || s.batchId === batch)
    .sort((a, b) => (sortAsc ? 1 : -1) * a.name.localeCompare(b.name));

  return (
    <div>
      <PageHeader eyebrow="Owner" title="Students" description={`${students.length} students enrolled`}
        action={<Button href="students/new" icon={<Plus size={16} />}>Add student</Button>} />

      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <Input placeholder="Search by name or roll…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <Select className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </Select>
        <Select className="w-auto" value={batch} onChange={(e) => setBatch(e.target.value)}>
          <option value="all">All batches</option>
          {[...new Map(students.map((s) => [s.batchId, s.batchName ?? s.batchId])).entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
        <Button size="sm" variant="ghost" onClick={() => setSortAsc((value) => !value)} icon={sortAsc ? <ArrowDownAZ size={15} /> : <ArrowUpAZ size={15} />}>Name</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No students yet" body="Add your first student to start tracking attendance and fees."
          action={<Button href="students/new" icon={<Plus size={16} />}>Add student</Button>} />
      ) : (
        <StampCard padded={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-semibold">Roll</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Batch</th>
                <th className="px-5 py-3 font-semibold">Guardian</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filtered.map((s) => (
                <tr key={s.id} className="cursor-pointer hover:bg-[var(--board-tint)]" onClick={() => router.push(`students/${s.id}`)}>
                  <td className="px-5 py-3.5 font-tabular text-ink-soft">{s.roll}</td>
                  <td className="px-5 py-3.5 font-semibold text-ink">{s.name}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{s.batchName ?? "—"}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{s.guardianPhone}</td>
                  <td className="px-5 py-3.5"><Badge tone={s.status === "active" ? "board" : "neutral"}>{s.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </StampCard>
      )}
    </div>
  );
}
