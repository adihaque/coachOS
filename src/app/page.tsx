import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StampCard } from "@/components/ui/StampCard";
import { Badge } from "@/components/ui/Badge";
import { CheckSquare, Wallet, Megaphone, Users, ArrowRight, BookOpenCheck } from "lucide-react";

const features = [
  { icon: Users, title: "Students & teachers", body: "One roster for every batch, guardian contact, and staff member — searchable, never lost in a notebook." },
  { icon: CheckSquare, title: "Attendance", body: "Teachers mark present, late, or absent in under a minute per class. Parents see it the same day." },
  { icon: Wallet, title: "Fees", body: "Know exactly who's paid and who's due, by month, by student, without opening a single spreadsheet." },
  { icon: Megaphone, title: "Notices & homework", body: "Post once, reach every student in a batch — or the whole coaching center — instantly." },
];

const plans = [
  { name: "Starter", price: "৳1,500", cap: "Up to 200 students", featured: false },
  { name: "Standard", price: "৳3,500", cap: "Up to 1,000 students", featured: true },
  { name: "Premium", price: "Custom", cap: "Unlimited, multi-branch", featured: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-xl font-semibold text-ink">CoachOS<span className="text-board">·</span></Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-soft sm:flex">
          <a href="#modules" className="hover:text-ink">Modules</a>
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/login" className="hover:text-ink">Log in</Link>
        </nav>
        <Button href="/register" size="sm">Start free trial</Button>
      </header>

      <section className="bg-ruled mx-6 mt-4 rounded-3xl border border-rule px-6 py-16 sm:px-12 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <Badge tone="chalk" className="mb-6">বাংলাদেশি কোচিং সেন্টারের জন্য তৈরি · Built for Bangladesh</Badge>
          <h1 className="font-display text-4xl font-semibold leading-[1.08] text-ink sm:text-6xl">The roll register,<br />finally caught up.</h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-ink-soft sm:text-lg">
            CoachOS replaces the attendance notebook, fees spreadsheet, and scattered WhatsApp updates with one secure place for শিক্ষার্থী, শিক্ষক, and owners.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/register" size="lg" icon={<ArrowRight size={18} />}>Start your coaching&apos;s trial</Button>
            <Button href="/pricing" size="lg" variant="secondary">See pricing</Button>
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-2xl">
          <StampCard punched className="font-tabular text-sm">
            <div className="mb-3 flex items-center justify-between border-b border-rule pb-3">
              <span className="font-display text-base font-semibold text-ink">HSC Physics — Batch A</span>
              <span className="text-ink-faint">Mon, 27 Jul</span>
            </div>
            <div className="space-y-2.5">
              {[
                { roll: "B-014", name: "Nusrat Jahan", mark: "Present" },
                { roll: "B-015", name: "Tanvir Ahmed", mark: "Present" },
                { roll: "B-016", name: "Rafiul Islam", mark: "Late" },
                { roll: "B-017", name: "Mahia Chowdhury", mark: "Absent" },
              ].map((row) => (
                <div key={row.roll} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-ink-faint">{row.roll}</span>
                    <span className="font-body font-medium text-ink">{row.name}</span>
                  </div>
                  <Badge tone={row.mark === "Present" ? "board" : row.mark === "Late" ? "chalk" : "red"}>{row.mark}</Badge>
                </div>
              ))}
            </div>
          </StampCard>
        </div>
      </section>

      <section id="modules" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 max-w-xl">
          <span className="font-tabular text-xs font-semibold uppercase tracking-widest text-board">What&apos;s in the register</span>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Four modules. Nothing you don&apos;t need yet.</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <StampCard key={f.title} className="h-full">
              <f.icon size={22} className="mb-4 text-board" strokeWidth={2} />
              <h3 className="font-display text-base font-semibold text-ink">{f.title}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{f.body}</p>
            </StampCard>
          ))}
        </div>
      </section>

      <section className="border-y border-rule bg-board-tint py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-8 font-display text-2xl font-semibold text-ink">One login for everyone in the coaching.</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Owner", "Runs the coaching — students, staff, fees, and notices."],
              ["Teacher", "Marks attendance and posts homework for their batches."],
              ["Student", "Checks attendance, dues, and homework from one dashboard."],
              ["You (super admin)", "Onboards coachings and manages every subscription."],
            ].map(([role, body]) => (
              <div key={role} className="rounded-xl border border-rule-strong bg-paper-raised p-4">
                <p className="font-display text-sm font-semibold text-ink">{role}</p>
                <p className="mt-1 text-sm text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-tabular text-xs font-semibold uppercase tracking-widest text-board">Pricing</span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Priced like a coaching center, not a corporation.</h2>
          </div>
          <Button href="/pricing" variant="secondary">Full pricing details</Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {plans.map((p) => (
            <StampCard key={p.name} className={p.featured ? "ring-2 ring-board" : ""}>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-semibold text-ink">{p.name}</span>
                {p.featured && <Badge tone="chalk">Most picked</Badge>}
              </div>
              <p className="mt-3 font-display text-3xl font-semibold text-ink">
                {p.price}{p.price !== "Custom" && <span className="text-sm font-normal text-ink-faint">/mo</span>}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{p.cap}</p>
            </StampCard>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <StampCard className="flex flex-col items-center gap-4 py-14 text-center sm:py-20">
          <BookOpenCheck size={28} className="text-board" />
          <h2 className="font-display text-3xl font-semibold text-ink">Take roll call the modern way.</h2>
          <p className="max-w-md text-sm text-ink-soft">Set up your coaching center in under ten minutes. No credit card needed to start.</p>
          <Button href="/register" size="lg" icon={<ArrowRight size={18} />}>Start free trial</Button>
        </StampCard>
      </section>

      <footer className="border-t border-rule px-6 py-8 text-center text-xs text-ink-faint">
        CoachOS — বাংলাদেশের কোচিং সেন্টারের জন্য।
      </footer>
    </div>
  );
}
