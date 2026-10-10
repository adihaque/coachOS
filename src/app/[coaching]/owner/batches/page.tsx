"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listBatches } from "@/lib/data";
import type { Batch } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Clock, Search } from "lucide-react";

export default function BatchesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("all");

  useEffect(() => {
    if (!user?.tenantId) return;
    listBatches(user.tenantId).then(setBatches);
  }, [user?.tenantId]);

  if (!batches) return <p className="text-sm text-ink-soft">Loading…</p>;
  const filtered = batches.filter((batch) =>
    batch.name.toLowerCase().includes(q.toLowerCase()) &&
    (subject === "all" || batch.subject === subject)
  );
  const subjects = [...new Set(batches.map((batch) => batch.subject))].sort();

  return (
    <div>
      <PageHeader eyebrow="Owner" title="Batches" description={`${batches.length} batches running`}
        action={<Button href="batches/new" icon={<Plus size={16} />}>Add batch</Button>} />
        <div className="mb-5 flex flex-wrap gap-2">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input className="pl-9" placeholder="Search batches…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select className="w-auto" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="all">All subjects</option>{subjects.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </div>

        {filtered.length === 0 ? (
        <EmptyState title="No batches yet" body="Create a batch to start assigning students and teachers." action={<Button href="batches/new" icon={<Plus size={16} />}>Add batch</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <StampCard key={b.id}>
              <div className="flex items-start justify-between">
                <p className="font-display font-semibold text-ink">{b.name}</p>
                <Badge tone="neutral">{b.subject}</Badge>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft"><Clock size={13} /> {b.timing}</p>
              <p className="mt-3 text-xs text-ink-faint">{b.teacherName ?? "No teacher assigned"} · {b.studentIds?.length ?? 0} students</p>
            </StampCard>
          ))}
        </div>
      )}
    </div>
  );
}
