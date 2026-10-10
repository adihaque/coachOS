"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, FormRow } from "@/components/ui/Field";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function NewTeacherPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", subjects: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState<{ email: string; tempPassword: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenantId) return;
    setError("");
    setSaving(true);
    try {
      const createUser = httpsCallable(functions, "createUser");
      const res = await createUser({
        role: "teacher", name: form.name, email: form.email, phone: form.phone,
        profile: {
          subjects: form.subjects.split(",").map((s) => s.trim()).filter(Boolean),
          batchIds: [], status: "active",
        },
      });
      const { tempPassword } = res.data as { tempPassword: string };

      setCredentials({ email: form.email, tempPassword });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message.replace(/^Firebase:\s*/, ""));
    } finally {
      setSaving(false);
    }
  }

  if (credentials) {
    return (
      <div className="mx-auto max-w-lg">
        <StampCard className="text-center">
          <CheckCircle2 size={28} className="mx-auto mb-3 text-board" />
          <h2 className="font-display text-lg font-semibold text-ink">Teacher added</h2>
          <p className="mt-1 text-sm text-ink-soft">Share these temporary credentials so they can log in and pick their own password.</p>
          <div className="mt-4 rounded-lg border border-rule bg-paper p-3 text-left font-tabular text-sm">
            <p>Email: {credentials.email}</p>
            <p>Temp password: {credentials.tempPassword}</p>
          </div>
          <Button className="mt-5 w-full" onClick={() => router.push("../teachers")}>Back to teachers</Button>
        </StampCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader eyebrow="Owner" title="Add a teacher" description="They'll get login credentials to sign in right away." />
      <StampCard>
        <form onSubmit={handleSubmit}>
          <FormRow>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormRow>
          <FormRow>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormRow>
          <FormRow>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormRow>
          <FormRow>
            <Label htmlFor="subjects" hint="comma-separated">Subjects</Label>
            <Input id="subjects" placeholder="Physics, Higher Math" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} />
          </FormRow>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-pen bg-red-pen-tint px-3 py-2.5 text-sm text-red-pen">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={saving}>{saving ? "Creating…" : "Add teacher"}</Button>
        </form>
      </StampCard>
    </div>
  );
}
