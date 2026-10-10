import { ReactNode } from "react";
import { StampCard } from "./StampCard";

export function StatCard({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: ReactNode }) {
  return (
    <StampCard className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-ink-soft">
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <span className="font-display text-3xl font-semibold text-ink">{value}</span>
      {hint && <span className="text-xs text-ink-faint font-tabular">{hint}</span>}
    </StampCard>
  );
}
