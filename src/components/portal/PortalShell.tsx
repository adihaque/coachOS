"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Menu, X, LogOut, type LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function PortalShell({ navItems, roleLabel, orgName, children }: { navItems: NavItem[]; roleLabel: string; orgName: string; children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <div className="flex items-center justify-between border-b border-rule bg-paper-raised px-4 py-3 lg:hidden">
        <span className="font-display text-lg font-semibold">CoachOS</span>
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen}><Menu size={22} /></button>
      </div>

      <aside className={clsx(
        "fixed inset-y-0 left-0 z-40 w-72 border-r border-rule bg-paper-raised transition-transform lg:static lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col p-5">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="font-display text-xl font-semibold text-ink">CoachOS<span className="text-board">·</span></Link>
            <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button>
          </div>

          <div className="mb-6 rounded-lg border border-rule bg-paper px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-ink">{orgName}</p>
            <p className="font-tabular text-xs uppercase tracking-wide text-board">{roleLabel}</p>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className={clsx("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                    active ? "bg-board text-white" : "text-ink-soft hover:bg-[var(--board-tint)] hover:text-ink")}>
                  <Icon size={17} strokeWidth={2.2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-rule pt-4">
            <p className="mb-2 truncate text-xs text-ink-faint">{user?.email}</p>
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-red-pen-tint hover:text-red-pen">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
