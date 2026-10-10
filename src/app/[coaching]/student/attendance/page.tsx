"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getStudent, listAttendanceForBatch } from "@/lib/data";
import type { Student, AttendanceRecord } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckSquare } from "lucide-react";

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tenantId || !user.uid) return;
    getStudent(user.tenantId, user.uid).then(async (st) => {
      setStudent(st);
      if (st) {
        const recs = await listAttendanceForBatch(user.tenantId!, st.batchId);
        setRecords(recs.sort((a, b) => b.date.localeCompare(a.date)));
      }
      setLoading(false);
    });
  }, [user?.tenantId, user?.uid]);

  if (loading) return <p className="text-sm text-ink-soft">Loading…</p>;
  if (!student) return <EmptyState title="No profile found" body="Ask your coaching owner to check your student record." />;

  const myMarks = records.map((r) => r.marks[user!.uid]).filter(Boolean);
  const presentCount = myMarks.filter((m) => m === "present").length;
  const pct = myMarks.length ? Math.round((presentCount / myMarks.length) * 100) : 0;

  return (
    <div>
      <PageHeader eyebrow="Student" title="My attendance" description={student.batchName} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <StatCard label="Attendance rate" value={`${pct}%`} icon={<CheckSquare size={16} />} hint={`${myMarks.length} classes recorded`} />
        <StatCard label="Present" value={String(presentCount)} hint={`of ${myMarks.length}`} />
      </div>

      {records.length === 0 ? (
        <EmptyState title="No attendance recorded yet" body="Your attendance will show up here once your teacher starts marking it." />
      ) : (
        <StampCard padded={false}>
          <div className="divide-y divide-rule">
            {records.map((r) => {
              const mark = r.marks[user!.uid];
              return (
                <div key={r.date} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-tabular text-ink">{r.date}</span>
                  <Badge tone={mark === "present" ? "board" : mark === "late" ? "chalk" : mark === "absent" ? "red" : "neutral"}>{mark ?? "Not marked"}</Badge>
                </div>
              );
            })}
          </div>
        </StampCard>
      )}
    </div>
  );
}
