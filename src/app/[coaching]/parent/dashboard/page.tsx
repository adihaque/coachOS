"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { attendanceSummary } from "@/lib/data";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import type { Student, AttendanceRecord, FeeEntry, Homework, Notice } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { StatCard } from "@/components/ui/StatCard";
import { AttendanceChart } from "@/components/ui/Charts";
import { CheckSquare, Wallet, BookOpen } from "lucide-react";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeEntry[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  useEffect(() => {
    if (!user?.tenantId) return;
    (async () => {
      const snapshot = await httpsCallable(functions, "getParentSnapshot")({});
      const data = snapshot.data as { students: Student[]; attendance: AttendanceRecord[]; fees: FeeEntry[]; homework: Homework[]; notices: Notice[] };
      const linkedStudents = data.students;
      setStudents(linkedStudents);
      setAttendance(data.attendance);
      setFees(data.fees);
      setHomework(data.homework);
      setNotices(data.notices);
    })();
  }, [user?.tenantId, user?.linkedStudentIds]);
  const due = fees.filter((fee) => fee.status === "due").reduce((sum, fee) => sum + fee.amount, 0);
  return <div><PageHeader eyebrow="Guardian" title="Family performance" description="Read-only attendance, fees, homework, and notices for linked learners." />
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><StatCard label="Learners" value={String(students.length)} /><StatCard label="Attendance" value={`${attendanceSummary(attendance).rate}%`} icon={<CheckSquare size={16} />} /><StatCard label="Fees due" value={`৳${due.toLocaleString()}`} icon={<Wallet size={16} />} /></div>
    <div className="grid gap-5 lg:grid-cols-2"><StampCard><AttendanceChart records={attendance} title="Family attendance trend" /></StampCard><StampCard><h2 className="font-display font-semibold text-ink">Homework & notices</h2><p className="mt-3 text-sm text-ink-soft">{homework.length} homework assignments and {notices.length} notices are available.</p><div className="mt-4 flex items-center gap-2 text-sm text-ink-soft"><BookOpen size={16} /> Review them with your learner before the next class.</div></StampCard></div>
  </div>;
}
