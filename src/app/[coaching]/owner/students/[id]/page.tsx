"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getStudent, listFees } from "@/lib/data";
import type { Student, FeeEntry } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<FeeEntry[]>([]);

  useEffect(() => {
    if (!user?.tenantId) return;
    getStudent(user.tenantId, id).then(setStudent);
    listFees(user.tenantId).then((all) => setFees(all.filter((f) => f.studentId === id)));
  }, [user?.tenantId, id]);

  if (!student) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div>
      <PageHeader eyebrow="Owner · Students" title={student.name} description={`Roll ${student.roll} · ${student.batchName ?? "No batch"}`}
        action={<Badge tone={student.status === "active" ? "board" : "neutral"}>{student.status}</Badge>} />

      <div className="grid gap-5 lg:grid-cols-2">
        <StampCard>
          <h3 className="mb-4 font-display text-base font-semibold text-ink">Profile</h3>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-ink-faint">Guardian</dt><dd className="text-ink">{student.guardianName}</dd>
            <dt className="text-ink-faint">Guardian phone</dt><dd className="font-tabular text-ink">{student.guardianPhone}</dd>
            <dt className="text-ink-faint">Address</dt><dd className="text-ink">{student.address || "—"}</dd>
            <dt className="text-ink-faint">Admission date</dt><dd className="font-tabular text-ink">{student.admissionDate}</dd>
          </dl>
        </StampCard>

        <StampCard padded={false}>
          <h3 className="border-b border-rule px-5 py-4 font-display text-base font-semibold text-ink">Fee history</h3>
          {fees.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-soft">No fee entries yet.</p>
          ) : (
            <div className="divide-y divide-rule">
              {fees.map((f) => (
                <div key={f.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-tabular text-ink">{f.month}</span>
                  <span className="font-tabular text-ink-soft">৳{f.amount}</span>
                  <Badge tone={f.status === "paid" ? "board" : "red"}>{f.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </StampCard>
      </div>
    </div>
  );
}
