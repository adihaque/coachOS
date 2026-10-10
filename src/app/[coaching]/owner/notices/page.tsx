"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listNotices } from "@/lib/data";
import type { Notice } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus } from "lucide-react";

export default function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[] | null>(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    listNotices(user.tenantId).then(setNotices);
  }, [user?.tenantId]);

  if (!notices) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div>
      <PageHeader eyebrow="Owner" title="Notices" description={`${notices.length} notices posted`}
        action={<Button href="notices/new" icon={<Plus size={16} />}>Post notice</Button>} />

      {notices.length === 0 ? (
        <EmptyState title="No notices yet" body="Post your first notice to reach every student at once." action={<Button href="notices/new" icon={<Plus size={16} />}>Post notice</Button>} />
      ) : (
        <div className="space-y-4">
          {notices.map((n) => (
            <StampCard key={n.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display font-semibold text-ink">{n.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{n.body}</p>
                </div>
                <Badge tone="neutral">{n.audienceLabel ?? "All students"}</Badge>
              </div>
              <p className="mt-3 font-tabular text-xs text-ink-faint">{n.createdBy} · {new Date(n.createdAt).toLocaleDateString()}</p>
            </StampCard>
          ))}
        </div>
      )}
    </div>
  );
}
