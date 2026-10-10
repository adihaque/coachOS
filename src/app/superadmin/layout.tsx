"use client";

import { ReactNode } from "react";
import { LayoutDashboard, Building2, Settings, ShieldCheck } from "lucide-react";
import { RouteGuard } from "@/components/portal/RouteGuard";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";

const navItems: NavItem[] = [
  { href: "/superadmin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/coachings", label: "Coachings", icon: Building2 },
  { href: "/superadmin/settings", label: "Settings", icon: Settings },
  { href: "/superadmin/operations", label: "Operations", icon: ShieldCheck },
];

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard allow={["superadmin"]}>
      <PortalShell navItems={navItems} roleLabel="Super admin" orgName="CoachOS HQ">
        {children}
      </PortalShell>
    </RouteGuard>
  );
}
