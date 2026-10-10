import { AlertCircle } from "lucide-react";
import { ReactNode } from "react";

export function ErrorState({
  title = "Something went wrong",
  body = "We couldn't load this page. Please try again.",
  action,
}: {
  title?: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-pen bg-red-pen-tint px-6 py-12 text-center">
      <AlertCircle size={24} className="mb-3 text-red-pen" />
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
