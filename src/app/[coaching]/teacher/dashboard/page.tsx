"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listBatches, listHomework, listAttendance, attendanceSummary } from "@/lib/data";
import type { Batch, Homework, AttendanceRecord } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Layers, BookOpen, Clock, CheckSquare } from "lucide-react";
import { AttendanceChart } from "@/components/ui/Charts";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tenantId) return;
    Promise.all([listBatches(user.tenantId), listHomework(user.tenantId), listAttendance(user.tenantId)])
      .then(([b, h, a]) => {
        setBatches(b.filter((batch) => batch.teacherId === user.uid));
        setHomework(h);
        setAttendance(a);
      })
      .finally(() => setLoading(false));
  }, [user?.tenantId, user?.uid]);

  if (loading) return <p className="text-sm text-ink-soft">Loading…</p>;

  const myHomework = homework.filter((h) => batches.some((b) => b.id === h.batchId));

  return (
    <div>
      <PageHeader eyebrow="Teacher" title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`} description="Your classes and what's due for them." />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="My batches" value={String(batches.length)} icon={<Layers size={16} />} />
        <StatCard label="Homework assigned" value={String(myHomework.length)} icon={<BookOpen size={16} />} />
        <StatCard label="Attendance rate" value={`${attendanceSummary(attendance.filter((record) => batches.some((batch) => batch.id === record.batchId))).rate}%`} icon={<CheckSquare size={16} />} />
      </div>

      <h2 className="mb-4 font-display text-lg font-semibold text-ink">My classes</h2>
      <StampCard className="mb-5"><AttendanceChart records={attendance.filter((record) => batches.some((batch) => batch.id === record.batchId))} title="My attendance trend" /></StampCard>
      {batches.length === 0 ? (
        <EmptyState title="No batches assigned yet" body="Ask your coaching owner to assign you to a batch." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((b) => (
            <StampCard key={b.id}>
              <p className="font-display font-semibold text-ink">{b.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft"><Clock size={13} /> {b.timing}</p>
              <p className="mt-3 text-xs text-ink-faint">{b.studentIds?.length ?? 0} students</p>
              <Button href={`attendance/${b.id}`} size="sm" variant="secondary" className="mt-4 w-full">Mark attendance</Button>
            </StampCard>
          ))}
        </div>
      )}
    </div>
  );
}
