"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listBatches, createNotice } from "@/lib/data";
import type { Batch } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FormRow } from "@/components/ui/Field";

export default function TeacherNewNoticePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState({ title: "", body: "", audience: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.tenantId) return;
    listBatches(user.tenantId).then((all) => {
      const mine = all.filter((b) => b.teacherId === user.uid);
      setBatches(mine);
      if (mine.length) setForm((f) => ({ ...f, audience: mine[0].id }));
    });
  }, [user?.tenantId, user?.uid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenantId) return;
    setSaving(true);
    const batch = batches.find((b) => b.id === form.audience);
    await createNotice(user.tenantId, {
      title: form.title, body: form.body, audience: form.audience, audienceLabel: batch?.name,
      createdBy: user.name ?? "Teacher", createdByRole: "teacher",
    });
    router.push("../dashboard");
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader eyebrow="Teacher" title="Post a notice" description="Only students in your batch will see this." />
      <StampCard>
        <form onSubmit={handleSubmit}>
          <FormRow>
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </FormRow>
          <FormRow>
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" rows={4} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </FormRow>
          <FormRow>
            <Label htmlFor="audience">Batch</Label>
            <Select id="audience" required value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              {batches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </Select>
          </FormRow>
          <Button type="submit" className="w-full" disabled={saving}>{saving ? "Posting…" : "Post notice"}</Button>
        </form>
      </StampCard>
    </div>
  );
}
