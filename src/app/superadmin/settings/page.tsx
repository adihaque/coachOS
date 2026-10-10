"use client";

import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Label, Input, FormRow } from "@/components/ui/Field";

export default function SuperAdminSettingsPage() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-md">
      <PageHeader eyebrow="Super admin" title="Your account" />
      <StampCard>
        <FormRow>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user?.email ?? ""} disabled />
        </FormRow>
        <p className="text-xs text-ink-faint">Password changes and team access for super admins are managed directly in the Firebase console for now.</p>
      </StampCard>
    </div>
  );
}
