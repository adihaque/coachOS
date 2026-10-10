import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import clsx from "clsx";

const baseControl =
  "w-full rounded-lg border border-rule bg-paper-raised px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint outline-none transition focus:border-board focus:ring-2 focus:ring-[var(--board-tint)]";

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">{children}</label>
      {hint && <span className="text-xs text-ink-faint font-tabular">{hint}</span>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(baseControl, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(baseControl, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(baseControl, "resize-none", props.className)} />;
}

export function FormRow({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}
