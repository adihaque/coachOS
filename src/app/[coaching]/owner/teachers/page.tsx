"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listTeachers } from "@/lib/data";
import type { Teacher } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Search } from "lucide-react";

export default function TeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("all");

  useEffect(() => {
    if (!user?.tenantId) return;
    listTeachers(user.tenantId).then(setTeachers);
  }, [user?.tenantId]);

  if (!teachers) return <p className="text-sm text-ink-soft">Loading…</p>;
  const subjects = [...new Set(teachers.flatMap((teacher) => teacher.subjects))].sort();
  const filtered = teachers.filter((teacher) =>
    (teacher.name.toLowerCase().includes(q.toLowerCase()) || teacher.email.toLowerCase().includes(q.toLowerCase()))
    && (subject === "all" || teacher.subjects.includes(subject))
  );

  return (
    <div>
      <PageHeader eyebrow="Owner" title="Teachers" description={`${teachers.length} teachers on staff`}
        action={<Button href="teachers/new" icon={<Plus size={16} />}>Add teacher</Button>} />
        <div className="mb-5 flex flex-wrap gap-2">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input className="pl-9" placeholder="Search teachers…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select className="w-auto" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="all">All subjects</option>{subjects.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </div>

        {filtered.length === 0 ? (
        <EmptyState title="No teachers yet" body="Add your teaching staff to assign them to batches." action={<Button href="teachers/new" icon={<Plus size={16} />}>Add teacher</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <StampCard key={t.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-ink-soft">{t.subjects.join(", ")}</p>
                </div>
                <Badge tone={t.status === "active" ? "board" : "neutral"}>{t.status}</Badge>
              </div>
              <p className="mt-3 font-tabular text-xs text-ink-faint">{t.phone}</p>
              <p className="font-tabular text-xs text-ink-faint">{t.email}</p>
            </StampCard>
          ))}
        </div>
      )}
    </div>
  );
}
