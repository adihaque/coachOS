"use client";

import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useTenant } from "@/lib/tenant-context";
import { updateTenantBranding } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, FormRow } from "@/components/ui/Field";
import { CheckCircle2, Upload } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [name, setName] = useState(tenant?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenantId) return;
    setSaving(true);
    await updateTenantBranding(user.tenantId, { name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.tenantId) return;
    setUploading(true);
    const fileRef = ref(storage, `tenants/${user.tenantId}/logo/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await updateTenantBranding(user.tenantId, { logoUrl: url });
    setUploading(false);
  }

  if (!tenant) return <p className="text-sm text-ink-soft">Loading…</p>;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader eyebrow="Owner" title="Coaching settings" description="Your branding and public details." />

      <StampCard className="mb-5">
        <h3 className="mb-4 font-display text-base font-semibold text-ink">Logo</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-rule bg-paper">
            {tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-lg font-semibold text-ink-faint">{tenant.name?.[0] ?? "R"}</span>
            )}
          </div>
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 rounded-lg border border-rule-strong stamp-btn bg-paper-raised px-3.5 py-2 text-sm font-semibold">
              <Upload size={14} /> {uploading ? "Uploading…" : "Upload logo"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
        </div>
      </StampCard>

      <StampCard>
        <form onSubmit={handleSave}>
          <FormRow>
            <Label htmlFor="name">Coaching name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </FormRow>
          <FormRow>
            <Label htmlFor="slug">Web address</Label>
            <Input id="slug" value={`yourapp.com/${tenant.slug}`} disabled />
          </FormRow>
          <Button type="submit" disabled={saving} icon={saved ? <CheckCircle2 size={16} /> : undefined}>
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </Button>
        </form>
      </StampCard>
    </div>
  );
}
