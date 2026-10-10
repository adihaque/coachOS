"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getStudent, listNotices } from "@/lib/data";
import type { Notice } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export default function StudentNoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[] | null>(null);

  useEffect(() => {
    if (!user?.tenantId || !user.uid) return;
    getStudent(user.tenantId, user.uid).then(async (st) => {
      const all = await listNotices(user.tenantId!);
      setNotices(all.filter((n) => n.audience === "all" || n.audience === st?.batchId));
    });
  }, [user?.tenantId, user?.uid]);

  if (!notices) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div>
      <PageHeader eyebrow="Student" title="Notices" description={`${notices.length} notices`} />

      {notices.length === 0 ? (
        <EmptyState title="No notices yet" body="Notices from your coaching will appear here." />
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <StampCard key={n.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display font-semibold text-ink">{n.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{n.body}</p>
                </div>
                <Badge tone="neutral">{n.audienceLabel ?? "All"}</Badge>
              </div>
              <p className="mt-3 font-tabular text-xs text-ink-faint">{n.createdBy} · {new Date(n.createdAt).toLocaleDateString()}</p>
            </StampCard>
          ))}
        </div>
      )}
    </div>
  );
}
