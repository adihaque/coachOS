import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { Check } from "lucide-react";

const plans = [
  { name: "Starter", price: "৳1,500", cap: "Up to 200 students", features: ["Student & teacher management", "Attendance tracking", "Fee tracking (manual)", "Notices & homework", "1 branch"], featured: false },
  { name: "Standard", price: "৳3,500", cap: "Up to 1,000 students", features: ["Everything in Starter", "CSV exports & reports", "Priority email support", "Custom coaching branding", "1 branch"], featured: true },
  { name: "Premium", price: "Custom", cap: "Unlimited students", features: ["Everything in Standard", "Multiple branches", "Priority support", "API access (on request)", "Dedicated onboarding"], featured: false },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-xl font-semibold text-ink">CoachOS<span className="text-board">·</span></Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-soft sm:flex">
          <Link href="/#modules" className="hover:text-ink">Modules</Link>
          <Link href="/login" className="hover:text-ink">Log in</Link>
        </nav>
        <Button href="/register" size="sm">Start free trial</Button>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <Badge tone="chalk" className="mb-5">Simple, per-coaching pricing</Badge>
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">One plan for the whole coaching.</h1>
        <p className="mx-auto mt-4 max-w-lg text-ink-soft">Not per teacher, not per student. Pick a plan by how many students you manage, and every role — owner, teacher, student — is included.</p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((p) => (
            <StampCard key={p.name} className={p.featured ? "ring-2 ring-board" : ""}>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-semibold text-ink">{p.name}</span>
                {p.featured && <Badge tone="chalk">Most picked</Badge>}
              </div>
              <p className="mt-4 font-display text-4xl font-semibold text-ink">
                {p.price}{p.price !== "Custom" && <span className="text-sm font-normal text-ink-faint">/mo</span>}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{p.cap}</p>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink">
                    <Check size={16} className="mt-0.5 shrink-0 text-board" />{f}
                  </li>
                ))}
              </ul>
              <Button href="/register" variant={p.featured ? "primary" : "secondary"} className="mt-7 w-full">Start free trial</Button>
            </StampCard>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-ink-faint">
          Payments are tracked manually while CoachOS is in early access — your CoachOS contact will confirm your plan and billing cycle directly.
        </p>
      </section>
    </div>
  );
}
