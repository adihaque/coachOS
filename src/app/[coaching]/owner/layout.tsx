"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { LayoutDashboard, Users, GraduationCap, Layers, CheckSquare, Wallet, Megaphone, FileBarChart, Settings, CreditCard, ClipboardList, Trophy, Receipt, Sparkles } from "lucide-react";
import { RouteGuard } from "@/components/portal/RouteGuard";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";
import { useTenant } from "@/lib/tenant-context";

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const { coaching } = useParams<{ coaching: string }>();
  const { tenant } = useTenant();
  const base = `/${coaching}/owner`;

  const navItems: NavItem[] = [
    { href: `${base}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `${base}/students`, label: "Students", icon: Users },
    { href: `${base}/teachers`, label: "Teachers", icon: GraduationCap },
    { href: `${base}/batches`, label: "Batches", icon: Layers },
    { href: `${base}/attendance`, label: "Attendance", icon: CheckSquare },
    { href: `${base}/fees`, label: "Fees", icon: Wallet },
    { href: `${base}/notices`, label: "Notices", icon: Megaphone },
    { href: `${base}/reports`, label: "Reports", icon: FileBarChart },
    { href: `${base}/subscription`, label: "Subscription", icon: CreditCard },
    { href: `${base}/admissions`, label: "Admissions", icon: Receipt },
    { href: `${base}/exams`, label: "Exams & results", icon: Trophy },
    { href: `${base}/payments`, label: "Payments", icon: ClipboardList },
    { href: `${base}/insights`, label: "Insights", icon: Sparkles },
    { href: `${base}/guardians`, label: "Guardians", icon: Users },
    { href: `${base}/assistant`, label: "Assistant", icon: Sparkles },
    { href: `${base}/settings`, label: "Settings", icon: Settings },
  ];

  return (
    <RouteGuard allow={["owner"]}>
      <PortalShell navItems={navItems} roleLabel="Owner" orgName={tenant?.name ?? "…"}>
        {children}
      </PortalShell>
    </RouteGuard>
  );
}
