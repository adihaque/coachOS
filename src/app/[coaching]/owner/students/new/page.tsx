"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { listBatches, listStudents } from "@/lib/data";
import type { Batch } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FormRow } from "@/components/ui/Field";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function NewStudentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState({ name: "", email: "", roll: "", batchId: "", guardianName: "", guardianPhone: "", address: "", admissionFee: "0", paymentStatus: "paid" as "paid" | "due" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [credentials, setCredentials] = useState<{ email: string; tempPassword: string } | null>(null);

  useEffect(() => {
    if (!user?.tenantId) return;
    setLoadingBatches(true);
    listBatches(user.tenantId).then(setBatches).catch(() => setError("Batches could not be loaded.")).finally(() => setLoadingBatches(false));
  }, [user?.tenantId]);

  useEffect(() => {
    if (!user?.tenantId || !form.batchId || form.roll) return;
    // The callable reserves this value transactionally; this preview keeps entry fast.
    listStudents(user.tenantId).then((students) => {
      const used = new Set(students.filter((student) => student.batchId === form.batchId).map((student) => Number(student.roll)).filter(Number.isFinite));
      let next = 1;
      while (used.has(next)) next += 1;
      setForm((current) => current.roll ? current : { ...current, roll: String(next).padStart(3, "0") });
    });
  }, [user?.tenantId, form.batchId, form.roll]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.tenantId) return;
    setError("");
    setSaving(true);
    try {
      const batch = batches.find((b) => b.id === form.batchId);
      const createUser = httpsCallable(functions, "createUser");
      const res = await createUser({
        role: "student",
        name: form.name,
        email: form.email,
        profile: {
          roll: form.roll, batchId: form.batchId, batchName: batch?.name,
          guardianName: form.guardianName, guardianPhone: form.guardianPhone, address: form.address,
          admissionDate: new Date().toISOString().slice(0, 10), status: "active",
        },
      });
      const { studentId, tempPassword } = res.data as { studentId: string; tempPassword: string };

      if (studentId) {
        const createAdmission = httpsCallable(functions, "createAdmission");
        await createAdmission({
          studentId,
          amount: Number(form.admissionFee) || 0,
          paymentStatus: form.paymentStatus,
          notes: `Admission for ${batch?.name ?? "batch"}`,
        });
      }

      setCredentials({ email: form.email, tempPassword });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message.replace(/^Firebase:\s*/, ""));
    } finally {
      setSaving(false);
    }
  }

  if (credentials) {
    if (!loadingBatches && batches.length === 0) {
      return (
        <div className="mx-auto max-w-lg">
          <PageHeader eyebrow="Owner" title="Add a student" description="Set up a batch before enrolling your first student." />
          <StampCard className="text-center">
            <h2 className="font-display text-lg font-semibold text-ink">No batches yet</h2>
            <p className="mt-1 text-sm text-ink-soft">Every student needs a batch so attendance, homework, and class access work correctly.</p>
            <Button className="mt-5 w-full" href="../batches/new">Create a batch</Button>
          </StampCard>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-lg">
        <StampCard className="text-center">
          <CheckCircle2 size={28} className="mx-auto mb-3 text-board" />
          <h2 className="font-display text-lg font-semibold text-ink">Student added</h2>
          <p className="mt-1 text-sm text-ink-soft">Share these temporary credentials with the student or their guardian.</p>
          <div className="mt-4 rounded-lg border border-rule bg-paper p-3 text-left font-tabular text-sm">
            <p>Email: {credentials.email}</p>
            <p>Temp password: {credentials.tempPassword}</p>
          </div>
          <Button className="mt-5 w-full" onClick={() => router.push("../students")}>Back to students</Button>
        </StampCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader eyebrow="Owner" title="Add a student" />
      <StampCard>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormRow>
            <FormRow>
              <Label htmlFor="roll">Roll number</Label>
              <Input id="roll" required placeholder="B-018" value={form.roll} onChange={(e) => setForm({ ...form, roll: e.target.value })} />
            </FormRow>
          </div>

          <FormRow>
            <Label htmlFor="email">Login email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormRow>

          <FormRow>
            <Label htmlFor="batch">Batch</Label>
            <Select id="batch" required value={form.batchId} onChange={(e) => setForm({ ...form, batchId: e.target.value })}>
              <option value="">Select a batch</option>
              {batches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </Select>
            {batches.length === 0 && <p className="mt-1.5 text-xs text-ink-faint">No batches yet — create one first from the Batches page.</p>}
          </FormRow>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow>
              <Label htmlFor="guardianName">Guardian name</Label>
              <Input id="guardianName" required value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
            </FormRow>
            <FormRow>
              <Label htmlFor="guardianPhone">Guardian phone</Label>
              <Input id="guardianPhone" required value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
            </FormRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow>
              <Label htmlFor="admissionFee">Admission fee (৳)</Label>
              <Input id="admissionFee" type="number" min="0" value={form.admissionFee} onChange={(e) => setForm({ ...form, admissionFee: e.target.value })} />
            </FormRow>
            <FormRow>
              <Label htmlFor="paymentStatus">Payment status</Label>
              <Select id="paymentStatus" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as "paid" | "due" })}>
                <option value="paid">Paid</option>
                <option value="due">Due</option>
              </Select>
            </FormRow>
          </div>

          <FormRow>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </FormRow>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-pen bg-red-pen-tint px-3 py-2.5 text-sm text-red-pen">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving…" : "Add student"}</Button>
        </form>
      </StampCard>
    </div>
  );
}
