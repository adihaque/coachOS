"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { listAdmissions, listStudents } from "@/lib/data";
import type { Admission, Student } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Receipt } from "lucide-react";

export default function AdmissionsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Admission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    Promise.all([listAdmissions(user.tenantId), listStudents(user.tenantId)]).then(([a, s]) => {
      setRows(a);
      setStudents(s);
      if (a[0]) setSelectedId(a[0].id);
    });
  }, [user?.tenantId]);

  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const selectedStudent = selected ? students.find((s) => s.id === selected.studentId) : null;

  return (
    <div>
      <PageHeader eyebrow="Owner" title="Admissions & receipts" description="Every admission has a traceable receipt." />

      {selected && (
        <div className="invoice-card mb-5 rounded-2xl border border-rule bg-paper p-6 shadow-sm print:block print:shadow-none print:border-none print:bg-white" aria-live="polite">
          <div className="flex items-start justify-between gap-4 border-b border-rule pb-4">
            <div>
              <p className="font-display text-xl font-semibold text-ink">CoachOS Invoice</p>
              <p className="text-xs uppercase tracking-[0.18em] text-ink-faint">Official receipt</p>
            </div>
            <div className="text-right text-sm text-ink-soft">
              <p className="font-semibold text-ink">{selected.receiptNumber}</p>
              <p>{new Date(selected.admittedAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-ink-faint">Student</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">{selectedStudent?.name ?? "Student"}</p>
              <p className="text-sm text-ink-soft">{selectedStudent?.batchName ?? "Batch not assigned"}</p>
            </div>
            <div className="text-right sm:text-left">
              <p className="text-xs uppercase text-ink-faint">Payment status</p>
              <p className="mt-1 text-base font-semibold capitalize text-ink">{selected.paymentStatus}</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-rule bg-paper-raised p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">Admission fee</span>
              <span className="font-display text-2xl font-semibold text-ink">৳{selected.amount.toLocaleString()}</span>
            </div>
            <p className="mt-3 text-xs text-ink-faint">Prepared by CoachOS for student onboarding and batch registration.</p>
          </div>
        </div>
      )}

      <StampCard padded={false}>
        <div className="divide-y divide-rule">
          {rows.map((row) => (
            <div key={row.id} className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-semibold text-ink">{students.find((s) => s.id === row.studentId)?.name ?? "Student"}</p>
                <p className="font-tabular text-xs text-ink-faint">{row.receiptNumber} · {new Date(row.admittedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span>৳{row.amount.toLocaleString()}</span>
                <Button size="sm" variant="secondary" onClick={() => { setSelectedId(row.id); window.print(); }} icon={<Receipt size={14} />}>Print receipt</Button>
              </div>
            </div>
          ))}
          {!rows.length && <p className="p-6 text-sm text-ink-soft">No admissions recorded yet.</p>}
        </div>
      </StampCard>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-card, .invoice-card * { visibility: visible; }
          .invoice-card { position: absolute; inset: 0; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

