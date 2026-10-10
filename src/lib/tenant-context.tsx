"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useParams } from "next/navigation";
import { getTenantForUser } from "./data";
import { useAuth } from "./auth-context";
import type { Tenant } from "./types";

interface TenantContextValue {
  tenant: Tenant | null;
  loading: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue>({ tenant: null, loading: true, refreshTenant: async () => undefined });

export function TenantProvider({ children }: { children: ReactNode }) {
  const params = useParams<{ coaching: string }>();
  const { user, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshTenant() {
    if (authLoading) return;
    if (!user?.tenantId) {
      setTenant(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const nextTenant = await getTenantForUser(user.tenantId, params.coaching);
    setTenant(nextTenant);
    setLoading(false);
  }

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setLoading(true);
    if (!user?.tenantId) {
      setTenant(null);
      setLoading(false);
      return () => { cancelled = true; };
    }
    getTenantForUser(user.tenantId, params.coaching)
      .then((t) => !cancelled && setTenant(t))
      .catch((error) => {
        if (!cancelled) {
          console.error("Unable to load the coaching center.", error);
          setTenant(null);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [authLoading, params.coaching, user?.tenantId]);

  return <TenantContext.Provider value={{ tenant, loading, refreshTenant }}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  return useContext(TenantContext);
}
