import { ReactNode } from "react";
import clsx from "clsx";

type Tone = "board" | "chalk" | "red" | "neutral" | "sky";

const toneClasses: Record<Tone, string> = {
  board: "bg-board-tint text-[var(--board-deep)] border-[var(--board)]",
  chalk: "bg-chalk-tint text-[#8a6412] border-[var(--chalk)]",
  red: "bg-red-pen-tint text-red-pen border-red-pen",
  neutral: "bg-paper text-ink-soft border-rule",
  sky: "bg-[#eaf0fe] text-sky border-sky",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold font-tabular tracking-wide", toneClasses[tone], className)}>
      {children}
    </span>
  );
}
