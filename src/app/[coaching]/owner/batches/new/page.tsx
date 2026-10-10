"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listTeachers, createBatch } from "@/lib/data";
import type { Teacher } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FormRow } from "@/components/ui/Field";

export default function NewBatchPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [form, setForm] = useState({ name: "", subject: "", timing: "", teacherId: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.tenantId) return;
    listTeachers(user.tenantId).then(setTeachers);
  }, [user?.tenantId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenantId) return;
    setSaving(true);
    const teacher = teachers.find((t) => t.id === form.teacherId);
    await createBatch(user.tenantId, {
      name: form.name, subject: form.subject, timing: form.timing,
      teacherId: form.teacherId || undefined, teacherName: teacher?.name, studentIds: [],
    });
    router.push("../batches");
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader eyebrow="Owner" title="Add a batch" />
      <StampCard>
        <form onSubmit={handleSubmit}>
          <FormRow>
            <Label htmlFor="name">Batch name</Label>
            <Input id="name" required placeholder="HSC Physics — Batch A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormRow>
          <FormRow>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </FormRow>
          <FormRow>
            <Label htmlFor="timing">Timing</Label>
            <Input id="timing" required placeholder="Sat/Mon/Wed, 5:00–6:30 PM" value={form.timing} onChange={(e) => setForm({ ...form, timing: e.target.value })} />
          </FormRow>
          <FormRow>
            <Label htmlFor="teacher">Teacher</Label>
            <Select id="teacher" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
              <option value="">Unassigned</option>
              {teachers.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </Select>
          </FormRow>
          <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving…" : "Add batch"}</Button>
        </form>
      </StampCard>
    </div>
  );
}
