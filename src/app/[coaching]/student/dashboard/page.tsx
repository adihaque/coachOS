"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getStudent, listFees, listHomework, listNotices, listAttendance, attendanceSummary } from "@/lib/data";
import type { Student, FeeEntry, Homework, Notice, AttendanceRecord } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { Wallet, BookOpen, Megaphone, CheckSquare, Clock } from "lucide-react";
import { AttendanceChart } from "@/components/ui/Charts";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<FeeEntry[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.tenantId || !user.uid) return;
    Promise.all([
      getStudent(user.tenantId, user.uid),
      listFees(user.tenantId, user.uid),
      listHomework(user.tenantId),
      listNotices(user.tenantId),
      listAttendance(user.tenantId),
    ]).then(([st, f, h, n, a]) => {
      setStudent(st);
      setFees(f);
      setHomework(st ? h.filter((hw) => hw.batchId === st.batchId) : []);
      setNotices(n.filter((notice) => notice.audience === "all" || notice.audience === st?.batchId));
      setAttendance(st ? a.filter((record) => record.batchId === st.batchId) : []);
    }).finally(() => setLoading(false));
  }, [user?.tenantId, user?.uid]);

  if (loading) return <p className="text-sm text-ink-soft">Loading…</p>;

  const due = fees.filter((f) => f.status === "due");
  const dueTotal = due.reduce((sum, f) => sum + f.amount, 0);
  const attendanceStats = attendanceSummary(attendance, user?.uid);

  return (
    <div>
      <PageHeader eyebrow="Student" title={`Hi${student?.name ? `, ${student.name.split(" ")[0]}` : ""}`}
        description={student ? `Roll ${student.roll} · ${student.batchName ?? "No batch"}` : undefined} />

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <StatCard label="Fees due" value={`৳${dueTotal.toLocaleString()}`} icon={<Wallet size={16} />} hint={`${due.length} pending`} />
        <StatCard label="Homework" value={String(homework.length)} icon={<BookOpen size={16} />} />
        <StatCard label="Notices" value={String(notices.length)} icon={<Megaphone size={16} />} />
        <StatCard label="Attendance" value={`${attendanceStats.rate}%`} icon={<CheckSquare size={16} />} hint={`${attendanceStats.present} present`} />
      </div>

      <StampCard className="mb-5">
        <div className="flex items-center gap-2"><Clock size={16} className="text-board" /><h3 className="font-display text-base font-semibold text-ink">Your schedule & progress</h3></div>
        <p className="mt-2 text-sm text-ink-soft">{student?.batchName ?? "Batch not assigned"} · Your coaching schedule is shown on the batch card.</p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-board-tint"><div className="h-full rounded-full bg-board" style={{ width: `${attendanceStats.rate}%` }} /></div>
        <p className="mt-2 text-xs text-ink-soft">{attendanceStats.present} present · {attendanceStats.late} late · {attendanceStats.absent} absent</p>
      </StampCard>
      <StampCard className="mb-5"><AttendanceChart records={attendance} title="Your attendance trend" /></StampCard>

      <StampCard padded={false}>
        <div className="border-b border-rule px-5 py-4">
          <h3 className="font-display text-base font-semibold text-ink">Latest notices</h3>
        </div>
        {notices.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-soft">Nothing posted yet.</p>
        ) : (
          <div className="divide-y divide-rule">
            {notices.slice(0, 5).map((n) => (
              <div key={n.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ink">{n.title}</span>
                  <Badge tone="neutral">{n.audienceLabel ?? "All"}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-ink-soft">{n.body}</p>
              </div>
            ))}
          </div>
        )}
      </StampCard>
    </div>
  );
}
