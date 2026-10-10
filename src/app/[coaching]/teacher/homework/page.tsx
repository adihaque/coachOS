"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listHomework, listBatches, updateHomeworkStatus } from "@/lib/data";
import type { Homework, Batch } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Archive, Plus } from "lucide-react";

export default function TeacherHomeworkPage() {
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.tenantId) return;
    const [items, batchRows] = await Promise.all([listHomework(user.tenantId), listBatches(user.tenantId)]);
    const mine = batchRows.filter((batch) => batch.teacherId === user.uid).map((batch) => batch.id);
    setHomework(items.filter((hw) => mine.includes(hw.batchId)));
    setBatches(batchRows);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function archiveHomework(id: string) {
    if (!user?.tenantId) return;
    await updateHomeworkStatus(user.tenantId, id, true);
    await load();
  }

  const activeHomework = homework.filter((h) => !h.archived && h.status !== "archived");
  const archivedHomework = homework.filter((h) => h.archived || h.status === "archived");

  if (loading) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div>
      <PageHeader eyebrow="Teacher" title="Homework" description={`${activeHomework.length} active assignments`}
        action={<Button href="homework/new" icon={<Plus size={16} />}>Assign homework</Button>} />

      {activeHomework.length === 0 ? (
        <EmptyState title="No active homework" body="Give your first assignment to a batch." action={<Button href="homework/new" icon={<Plus size={16} />}>Assign homework</Button>} />
      ) : (
        <div className="space-y-4">
          {activeHomework.map((h) => {
            const expired = new Date(h.dueDate) < new Date();
            return (
              <StampCard key={h.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display font-semibold text-ink">{h.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">{h.details}</p>
                  </div>
                  <Badge tone={expired ? "red" : "neutral"}>{expired ? "expired" : "active"}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-tabular text-xs text-ink-faint">Due {h.dueDate}</p>
                  <Button size="sm" variant="ghost" onClick={() => archiveHomework(h.id)} icon={<Archive size={14} />}>Archive</Button>
                </div>
              </StampCard>
            );
          })}
        </div>
      )}

      {archivedHomework.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-xs uppercase tracking-wide text-ink-faint">Archived homework</p>
          <div className="space-y-3">
            {archivedHomework.map((h) => (
              <StampCard key={h.id}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-display font-semibold text-ink">{h.title}</p>
                    <p className="text-xs text-ink-faint">Archived {h.archivedAt ? new Date(h.archivedAt).toLocaleDateString() : "recently"}</p>
                  </div>
                  <Badge tone="neutral">{h.batchName ?? batches.find((b) => b.id === h.batchId)?.name}</Badge>
                </div>
              </StampCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
