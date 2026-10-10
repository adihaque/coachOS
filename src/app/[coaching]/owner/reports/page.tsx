"use client";

import { useAuth } from "@/lib/auth-context";
import { listStudents, listFees, listTeachers } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Download, Users, Wallet, GraduationCap } from "lucide-react";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))];
  return lines.join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { user } = useAuth();

  async function exportStudents() {
    if (!user?.tenantId) return;
    const rows = await listStudents(user.tenantId);
    downloadCsv("students.csv", toCsv(rows as unknown as Record<string, unknown>[]));
  }

  async function exportFees() {
    if (!user?.tenantId) return;
    const rows = await listFees(user.tenantId);
    downloadCsv("fees.csv", toCsv(rows as unknown as Record<string, unknown>[]));
  }

  async function exportTeachers() {
    if (!user?.tenantId) return;
    const rows = await listTeachers(user.tenantId);
    downloadCsv("teachers.csv", toCsv(rows as unknown as Record<string, unknown>[]));
  }

  const reports = [
    { title: "Students", body: "Every student, batch, and guardian contact.", icon: Users, action: exportStudents },
    { title: "Fees", body: "Fee entries with paid/due status by month.", icon: Wallet, action: exportFees },
    { title: "Teachers", body: "Staff list with subjects and contact info.", icon: GraduationCap, action: exportTeachers },
  ];

  return (
    <div>
      <PageHeader eyebrow="Owner" title="Reports" description="Export anything as a CSV — open it in Excel or Google Sheets." />
      <div className="grid gap-4 sm:grid-cols-3">
        {reports.map((r) => (
          <StampCard key={r.title}>
            <r.icon size={20} className="mb-3 text-board" />
            <h3 className="font-display font-semibold text-ink">{r.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{r.body}</p>
            <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={r.action} icon={<Download size={14} />}>Export CSV</Button>
          </StampCard>
        ))}
      </div>
    </div>
  );
}
