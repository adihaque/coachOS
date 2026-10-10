"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FormRow } from "@/components/ui/Field";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function NewCoachingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [plan, setPlan] = useState("starter");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ tenantId: string; tempPassword: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const createTenant = httpsCallable(functions, "createTenant");
      const res = await createTenant({ name, slug: slugify(name), plan, ownerName, ownerEmail });
      setResult(res.data as { tenantId: string; tempPassword: string });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message.replace(/^Firebase:\s*/, ""));
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-md">
        <StampCard className="text-center">
          <CheckCircle2 size={28} className="mx-auto mb-3 text-board" />
          <h2 className="font-display text-lg font-semibold text-ink">Coaching created</h2>
          <p className="mt-1 text-sm text-ink-soft">Share these temporary credentials with {ownerName || "the owner"} — they should change the password on first login.</p>
          <div className="mt-4 rounded-lg border border-rule bg-paper p-3 text-left font-tabular text-sm">
            <p>Email: {ownerEmail}</p>
            <p>Temp password: {result.tempPassword}</p>
          </div>
          <Button className="mt-5 w-full" onClick={() => router.push(`/superadmin/coachings/${result.tenantId}`)}>View coaching</Button>
        </StampCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader eyebrow="Super admin" title="Add a coaching center" />
      <StampCard>
        <form onSubmit={handleSubmit}>
          <FormRow>
            <Label htmlFor="name">Coaching name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Bright Prep Coaching" />
            {name && <p className="mt-1.5 font-tabular text-xs text-ink-faint">yourapp.com/{slugify(name)}</p>}
          </FormRow>
          <FormRow>
            <Label htmlFor="ownerName">Owner name</Label>
            <Input id="ownerName" required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          </FormRow>
          <FormRow>
            <Label htmlFor="ownerEmail">Owner email</Label>
            <Input id="ownerEmail" type="email" required value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
          </FormRow>
          <FormRow>
            <Label htmlFor="plan">Plan</Label>
            <Select id="plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="starter">Starter</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </Select>
          </FormRow>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-pen bg-red-pen-tint px-3 py-2.5 text-sm text-red-pen">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create coaching"}</Button>
        </form>
      </StampCard>
    </div>
  );
}
