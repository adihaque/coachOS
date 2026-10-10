"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listStudents, listFees, listNotices, listAttendance, listHomework, listBatches, attendanceSummary, buildActivityFeed } from "@/lib/data";
import type { Student, FeeEntry, Notice, AttendanceRecord, ActivityEntry, Batch } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Users, AlertTriangle, Megaphone, Plus, CheckSquare, Activity } from "lucide-react";
import { AttendanceChart, BatchLoadChart } from "@/components/ui/Charts";
import { ErrorState } from "@/components/ui/ErrorState";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeEntry[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.tenantId) return;
    setError("");
    Promise.all([listStudents(user.tenantId), listFees(user.tenantId), listNotices(user.tenantId), listAttendance(user.tenantId), listHomework(user.tenantId), listBatches(user.tenantId)])
      .then(([s, f, n, a, h, b]) => {
        setStudents(s); setFees(f); setNotices(n); setAttendance(a);
        setBatches(b);
        setActivities(buildActivityFeed(f, n, h, a));
      })
      .catch(() => setError("Dashboard data could not be loaded right now."))
      .finally(() => setLoading(false));
  }, [user?.tenantId]);

  if (loading) return <p className="text-sm text-ink-soft">Loading…</p>;
  if (error) return <ErrorState body={error} action={<Button onClick={() => window.location.reload()}>Try again</Button>} />;

  const dueFees = fees.filter((f) => f.status === "due");
  const dueAmount = dueFees.reduce((sum, f) => sum + f.amount, 0);
  const activeStudents = students.filter((s) => s.status === "active").length;
  const attendanceStats = attendanceSummary(attendance);

  return (
    <div>
      <PageHeader eyebrow="Owner" title={`Good to see you${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Here's what's happening across your coaching center today."
        action={<Button href="students/new" icon={<Plus size={16} />}>Add student</Button>} />

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <StatCard label="Active students" value={String(activeStudents)} icon={<Users size={16} />} />
        <StatCard label="Fees due" value={`৳${dueAmount.toLocaleString()}`} icon={<AlertTriangle size={16} />} hint={`${dueFees.length} entries`} />
        <StatCard label="Notices posted" value={String(notices.length)} icon={<Megaphone size={16} />} />
        <StatCard label="Attendance rate" value={`${attendanceStats.rate}%`} icon={<CheckSquare size={16} />} hint={`${attendanceStats.present} present`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <StampCard><AttendanceChart records={attendance} /></StampCard>
        <StampCard>
          <div className="flex items-center gap-2"><Activity size={16} className="text-board" /><h3 className="font-display text-base font-semibold text-ink">Owner activity</h3></div>
          <div className="mt-3 space-y-3">
            {activities.slice(0, 5).map((item) => <div key={item.id} className="border-b border-rule pb-2 last:border-0"><p className="text-sm font-medium text-ink">{item.title}</p><p className="text-xs text-ink-soft">{item.detail}</p></div>)}
          </div>

          <div className="mb-5 grid gap-5 lg:grid-cols-2">
            <StampCard><BatchLoadChart batches={batches} records={attendance} /></StampCard>
            <StampCard>
              <h3 className="font-display text-base font-semibold text-ink">Fee collection mix</h3>
              <div className="mt-5 flex items-center gap-6">
                <div className="relative h-28 w-28 rounded-full" style={{ background: `conic-gradient(var(--board) ${fees.length ? (fees.filter((fee) => fee.status === "paid").length / fees.length) * 100 : 0}%, var(--red-pen) 0)` }}>
                  <div className="absolute inset-4 flex items-center justify-center rounded-full bg-paper-raised text-center"><span className="font-display text-xl font-semibold text-ink">{fees.length ? Math.round((fees.filter((fee) => fee.status === "paid").length / fees.length) * 100) : 0}%</span></div>
                </div>
                <div className="space-y-2 text-sm"><p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-board" />Paid · {fees.filter((fee) => fee.status === "paid").length}</p><p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-red-pen" />Due · {dueFees.length}</p><p className="text-xs text-ink-soft">Based on {fees.length} ledger entries.</p></div>
              </div>
            </StampCard>
          </div>
        </StampCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <StampCard padded={false}>
          <div className="flex items-center justify-between border-b border-rule px-5 py-4">
            <h3 className="font-display text-base font-semibold text-ink">Fees due</h3>
            <Button href="fees" variant="ghost" size="sm">View all</Button>
          </div>
          {dueFees.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-soft">Nothing due — nicely kept.</p>
          ) : (
            <div className="divide-y divide-rule">
              {dueFees.slice(0, 5).map((f) => (
                <div key={f.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-medium text-ink">{f.studentName}</span>
                  <span className="font-tabular text-ink-soft">৳{f.amount} · {f.month}</span>
                </div>
              ))}
            </div>
          )}
        </StampCard>

        <StampCard padded={false}>
          <div className="flex items-center justify-between border-b border-rule px-5 py-4">
            <h3 className="font-display text-base font-semibold text-ink">Latest notices</h3>
            <Button href="notices" variant="ghost" size="sm">View all</Button>
          </div>
          {notices.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-soft">No notices posted yet.</p>
          ) : (
            <div className="divide-y divide-rule">
              {notices.slice(0, 5).map((n) => (
                <div key={n.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{n.title}</span>
                    <Badge tone="neutral">{n.audienceLabel ?? "All"}</Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </StampCard>
      </div>
    </div>
  );
}
