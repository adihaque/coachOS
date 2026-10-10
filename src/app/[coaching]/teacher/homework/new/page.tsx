"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listBatches, createHomework } from "@/lib/data";
import type { Batch } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FormRow } from "@/components/ui/Field";

export default function NewHomeworkPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState({
    batchId: searchParams.get("batch") ?? "",
    title: "",
    details: "",
    dueDate: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.tenantId) return;
    listBatches(user.tenantId).then((all) => setBatches(all.filter((b) => b.teacherId === user.uid)));
  }, [user?.tenantId, user?.uid]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenantId) return;
    setSaving(true);
    const batch = batches.find((b) => b.id === form.batchId);
    await createHomework(user.tenantId, {
      batchId: form.batchId, batchName: batch?.name, title: form.title, details: form.details, dueDate: form.dueDate,
    });
    router.push("../homework");
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader eyebrow="Teacher" title="Assign homework" />
      <StampCard>
        <form onSubmit={handleSubmit}>
          <FormRow>
            <Label htmlFor="batch">Batch</Label>
            <Select id="batch" required value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>
              <option value="">Select a batch</option>
              {batches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </Select>
          </FormRow>
          <FormRow>
            <Label htmlFor="title">Title</Label>
            <Input id="title" required placeholder="Chapter 4 — Work, Energy & Power" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </FormRow>
          <FormRow>
            <Label htmlFor="details">Details</Label>
            <Textarea id="details" rows={4} required value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
          </FormRow>
          <FormRow>
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </FormRow>
          <Button type="submit" className="w-full" disabled={saving}>{saving ? "Assigning…" : "Assign homework"}</Button>
        </form>
      </StampCard>
    </div>
  );
}
