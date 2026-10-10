"use client";

import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { RouteGuard } from "@/components/portal/RouteGuard";
import { PortalShell, type NavItem } from "@/components/portal/PortalShell";
import { useTenant } from "@/lib/tenant-context";

export default function ParentLayout({ children }: { children: ReactNode }) {
  const { coaching } = useParams<{ coaching: string }>();
  const { tenant } = useTenant();
  const base = `/${coaching}/parent`;
  const navItems: NavItem[] = [{ href: `${base}/dashboard`, label: "Family dashboard", icon: LayoutDashboard }];
  return <RouteGuard allow={["parent"]}><PortalShell navItems={navItems} roleLabel="Guardian" orgName={tenant?.name ?? "…"}>{children}</PortalShell></RouteGuard>;
}
