"use client";

import type { AttendanceRecord, Batch } from "@/lib/types";
import { attendanceSummary } from "@/lib/data";

export function AttendanceChart({ records, title = "Attendance trend" }: { records: AttendanceRecord[]; title?: string }) {
  const byDate = records.reduce<Record<string, AttendanceRecord[]>>((groups, record) => {
    (groups[record.date] ??= []).push(record);
    return groups;
  }, {});
  const points = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([date, dateRecords]) => ({
    label: date.slice(5),
    value: attendanceSummary(dateRecords).rate,
  }));
  const width = 560;
  const height = 180;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const coordinates = points.map((point, index) => `${index * step},${height - (point.value / 100) * 140 - 10}`).join(" ");

  return (
    <div role="img" aria-label={`${title}: ${points.map((point) => `${point.label} ${point.value}%`).join(", ") || "no data"}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
        <span className="text-xs text-ink-faint">last {points.length} sessions</span>
      </div>
      {points.length === 0 ? <p className="mt-8 text-sm text-ink-soft">Attendance will appear after the first class.</p> : (
        <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 h-44 w-full overflow-visible" aria-hidden="true">
          <line x1="0" y1="30" x2={width} y2="30" stroke="currentColor" className="text-rule" />
          <line x1="0" y1="100" x2={width} y2="100" stroke="currentColor" className="text-rule" />
          <line x1="0" y1="170" x2={width} y2="170" stroke="currentColor" className="text-rule" />
          <polyline points={coordinates} fill="none" stroke="var(--board)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point, index) => {
            const x = index * step;
            const y = height - (point.value / 100) * 140 - 10;
            return <g key={`${point.label}-${index}`}><circle cx={x} cy={y} r="5" fill="var(--chalk)" stroke="var(--board)" strokeWidth="3" /><text x={x} y="178" textAnchor="middle" className="fill-ink-faint text-[11px]">{point.label}</text></g>;
          })}
        </svg>
      )}
    </div>
  );
}

export function BatchLoadChart({ batches, records }: { batches: Batch[]; records: AttendanceRecord[] }) {
  const rows = batches.map((batch) => {
    const batchRecords = records.filter((record) => record.batchId === batch.id);
    return { name: batch.name, rate: attendanceSummary(batchRecords).rate, count: batch.studentIds?.length ?? 0 };
  });
  return (
    <div aria-label="Attendance by batch">
      <h3 className="font-display text-base font-semibold text-ink">Batch pulse</h3>
      <div className="mt-4 space-y-4">
        {rows.map((row) => (
          <div key={row.name}>
            <div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate font-medium text-ink">{row.name}</span><span className="font-tabular text-ink-soft">{row.rate}% · {row.count} learners</span></div>
            <div className="h-2.5 rounded-full bg-board-tint"><div className="h-full rounded-full bg-board transition-all" style={{ width: `${row.rate}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
