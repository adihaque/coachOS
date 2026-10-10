"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { LayoutDashboard, CheckSquare, Wallet, BookOpen, Megaphone } from "lucide-react";
import { RouteGuard } from "@/components/portal/RouteGuard";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";
import { useTenant } from "@/lib/tenant-context";

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { coaching } = useParams<{ coaching: string }>();
  const { tenant } = useTenant();
  const base = `/${coaching}/student`;

  const navItems: NavItem[] = [
    { href: `${base}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `${base}/attendance`, label: "Attendance", icon: CheckSquare },
    { href: `${base}/fees`, label: "Fees", icon: Wallet },
    { href: `${base}/homework`, label: "Homework", icon: BookOpen },
    { href: `${base}/notices`, label: "Notices", icon: Megaphone },
  ];

  return (
    <RouteGuard allow={["student"]}>
      <PortalShell navItems={navItems} roleLabel="Student" orgName={tenant?.name ?? "…"}>
        {children}
      </PortalShell>
    </RouteGuard>
  );
}
