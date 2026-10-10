"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listBatches, listStudents } from "@/lib/data";
import type { Batch, Student } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Clock, Users } from "lucide-react";

export default function TeacherClassesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tenantId) return;
    Promise.all([listBatches(user.tenantId), listStudents(user.tenantId)])
      .then(([b, s]) => { setBatches(b.filter((batch) => batch.teacherId === user.uid)); setStudents(s); })
      .finally(() => setLoading(false));
  }, [user?.tenantId, user?.uid]);

  if (loading) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div>
      <PageHeader eyebrow="Teacher" title="My classes" description={`${batches.length} batches assigned to you`} />

      {batches.length === 0 ? (
        <EmptyState title="No batches yet" body="Ask your coaching owner to assign you to a batch." />
      ) : (
        <div className="space-y-4">
          {batches.map((b) => {
            const roster = students.filter((s) => s.batchId === b.id);
            return (
              <StampCard key={b.id}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-display font-semibold text-ink">{b.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft"><Clock size={13} /> {b.timing}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft"><Users size={13} /> {roster.length} students</p>
                  </div>
                  <div className="flex gap-2">
                    <Button href={`attendance/${b.id}`} size="sm">Mark attendance</Button>
                    <Button href={`../homework/new?batch=${b.id}`} size="sm" variant="secondary">Assign homework</Button>
                  </div>
                </div>
              </StampCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
