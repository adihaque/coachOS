"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { LayoutDashboard, Layers, BookOpen, Megaphone } from "lucide-react";
import { RouteGuard } from "@/components/portal/RouteGuard";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";
import { useTenant } from "@/lib/tenant-context";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const { coaching } = useParams<{ coaching: string }>();
  const { tenant } = useTenant();
  const base = `/${coaching}/teacher`;

  const navItems: NavItem[] = [
    { href: `${base}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `${base}/classes`, label: "My classes", icon: Layers },
    { href: `${base}/homework`, label: "Homework", icon: BookOpen },
    { href: `${base}/notices/new`, label: "Post notice", icon: Megaphone },
  ];

  return (
    <RouteGuard allow={["teacher"]}>
      <PortalShell navItems={navItems} roleLabel="Teacher" orgName={tenant?.name ?? "…"}>
        {children}
      </PortalShell>
    </RouteGuard>
  );
}
