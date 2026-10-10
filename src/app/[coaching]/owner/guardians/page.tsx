"use client";
import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { listGuardians, listStudents } from "@/lib/data";
import type { Guardian, Student } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FormRow } from "@/components/ui/Field";
export default function GuardiansPage() {
  const { user } = useAuth(); const [rows, setRows] = useState<Guardian[]>([]); const [students, setStudents] = useState<Student[]>([]); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [studentId, setStudentId] = useState(""); const [credentials, setCredentials] = useState("");
  async function create() { if (!name || !email || !phone || !studentId) return; const fn = httpsCallable(functions, "createGuardian"); const result = await fn({ name, email, phone, studentIds: [studentId] }); setCredentials((result.data as { tempPassword: string }).tempPassword); if (user?.tenantId) setRows(await listGuardians(user.tenantId)); }
  useEffect(() => { if (user?.tenantId) Promise.all([listGuardians(user.tenantId), listStudents(user.tenantId)]).then(([g, s]) => { setRows(g); setStudents(s); }); }, [user?.tenantId]);
  return <div><PageHeader eyebrow="Owner" title="Guardians" description="Invite read-only parent accounts linked to one or more students." /><StampCard className="mb-5"><div className="grid gap-3 sm:grid-cols-2"><FormRow><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></FormRow><FormRow><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FormRow><FormRow><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></FormRow><FormRow><Label>Student</Label><Select value={studentId} onChange={(e) => setStudentId(e.target.value)}><option value="">Select student</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.roll}</option>)}</Select></FormRow></div><Button onClick={create}>Invite guardian</Button>{credentials && <p className="mt-3 text-sm text-board">Temporary password: <span className="font-tabular">{credentials}</span></p>}</StampCard><div className="space-y-3">{rows.map((row) => <StampCard key={row.id}><p className="font-semibold text-ink">{row.name}</p><p className="text-sm text-ink-soft">{row.email} · {row.studentIds.length} linked learner(s)</p></StampCard>)}</div></div>;
}
