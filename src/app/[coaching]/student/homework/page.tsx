"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getStudent, listHomework } from "@/lib/data";
import type { Homework } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { EmptyState } from "@/components/ui/EmptyState";

export default function StudentHomeworkPage() {
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework[] | null>(null);

  useEffect(() => {
    if (!user?.tenantId || !user.uid) return;
    getStudent(user.tenantId, user.uid).then(async (st) => {
      if (!st) { setHomework([]); return; }
      const all = await listHomework(user.tenantId!);
      setHomework(all.filter((h) => h.batchId === st.batchId));
    });
  }, [user?.tenantId, user?.uid]);

  if (!homework) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div>
      <PageHeader eyebrow="Student" title="Homework" description={`${homework.length} assignments`} />

      {homework.length === 0 ? (
        <EmptyState title="No homework yet" body="Your teacher hasn't assigned anything yet — check back soon." />
      ) : (
        <div className="space-y-4">
          {homework.map((h) => (
            <StampCard key={h.id}>
              <p className="font-display font-semibold text-ink">{h.title}</p>
              <p className="mt-1 text-sm text-ink-soft">{h.details}</p>
              <p className="mt-3 font-tabular text-xs text-ink-faint">Due {h.dueDate}</p>
            </StampCard>
          ))}
        </div>
      )}
    </div>
  );
}
