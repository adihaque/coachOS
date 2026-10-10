"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listBatches, listStudents, getAttendance } from "@/lib/data";
import type { Batch, Student, AttendanceRecord } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { Select, Input, Label } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";

export default function OwnerAttendancePage() {
  const { user } = useAuth();
  const { coaching } = useParams<{ coaching: string }>();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [record, setRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    Promise.all([listBatches(user.tenantId), listStudents(user.tenantId)]).then(([b, s]) => {
      setBatches(b); setStudents(s);
      if (b.length) setBatchId(b[0].id);
    });
  }, [user?.tenantId]);

  useEffect(() => {
    if (!user?.tenantId || !batchId) return;
    getAttendance(user.tenantId, batchId, date).then(setRecord);
  }, [user?.tenantId, batchId, date]);

  const batchStudents = students.filter((s) => s.batchId === batchId);
  const summary = record
    ? Object.values(record.marks).reduce((acc, mark) => {
        acc.present += mark === "present" ? 1 : 0;
        acc.late += mark === "late" ? 1 : 0;
        acc.absent += mark === "absent" ? 1 : 0;
        return acc;
      }, { present: 0, late: 0, absent: 0 })
    : { present: 0, late: 0, absent: 0 };
  const attendanceRoute = coaching ? `/${coaching}/teacher/attendance/${batchId}` : "#";

  return (
    <div>
      <PageHeader eyebrow="Owner" title="Attendance" description="Review any batch, any day and take live attendance when needed." />

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="w-56">
          <Label htmlFor="batch">Batch</Label>
          <Select id="batch" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            {batches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </Select>
        </div>
        <div className="w-48">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {batches.length === 0 ? (
        <EmptyState title="No batches yet" body="Create a batch first, then attendance will show up here." />
      ) : batchStudents.length === 0 ? (
        <EmptyState title="No students in this batch" body="Add students to this batch to track their attendance." />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <StampCard className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-faint">Present</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink">{summary.present}</p>
              </div>
              <CheckCircle2 size={20} className="text-board" />
            </StampCard>
            <StampCard className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-faint">Late</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink">{summary.late}</p>
              </div>
              <Clock3 size={20} className="text-chalk" />
            </StampCard>
            <StampCard className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-faint">Absent</p>
                <p className="mt-1 font-display text-2xl font-semibold text-ink">{summary.absent}</p>
              </div>
              <XCircle size={20} className="text-red-pen" />
            </StampCard>
          </div>

          <div className="mb-5 flex justify-end">
            <Button href={attendanceRoute} variant="secondary" size="sm">Take attendance</Button>
          </div>

          <StampCard padded={false}>
            <div className="divide-y divide-rule">
              {batchStudents.map((s) => {
                const mark = record?.marks?.[s.id];
                return (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-tabular text-ink-faint">{s.roll}</span>
                      <span className="font-medium text-ink">{s.name}</span>
                    </div>
                    <Badge tone={mark === "present" ? "board" : mark === "late" ? "chalk" : mark === "absent" ? "red" : "neutral"}>{mark ? mark : "Not marked"}</Badge>
                  </div>
                );
              })}
            </div>
          </StampCard>
        </>
      )}
    </div>
  );
}
