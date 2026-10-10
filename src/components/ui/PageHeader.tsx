import { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <span className="mb-1 block font-tabular text-xs font-semibold uppercase tracking-widest text-board">{eyebrow}</span>
        )}
        <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-xl text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
