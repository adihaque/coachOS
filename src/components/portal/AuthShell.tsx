import { ReactNode } from "react";
import Link from "next/link";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="bg-ruled flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center font-display text-xl font-semibold text-ink">CoachOS<span className="text-board">·</span></Link>
        <div className="stamp-card p-7">
          <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-ink-soft">{footer}</div>}
      </div>
    </div>
  );
}
