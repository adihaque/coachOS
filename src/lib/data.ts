import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, setDoc, query, orderBy, where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Tenant, Student, Teacher, Batch, FeeEntry, Notice, Homework, AttendanceRecord, ActivityEntry, Guardian, Admission, Exam, ExamQuestion, ExamResult, PaymentTransaction, Insight } from "./types";

const nowIso = () => new Date().toISOString();

// ---------- Tenants ----------

export async function listTenants(): Promise<Tenant[]> {
  const snap = await getDocs(query(collection(db, "tenants"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Tenant, "id">) }));
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const snap = await getDoc(doc(db, "tenants", tenantId));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Tenant, "id">) }) : null;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const snap = await getDocs(query(collection(db, "tenants"), where("slug", "==", slug)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Tenant, "id">) };
}

export async function getTenantForUser(tenantId: string, slug: string): Promise<Tenant | null> {
  const snap = await getDoc(doc(db, "tenants", tenantId));
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<Tenant, "id">;
  return data.slug === slug ? { id: snap.id, ...data } : null;
}

export async function createTenant(input: {
  name: string; slug: string; ownerName: string; ownerEmail: string; plan: Tenant["plan"];
}): Promise<string> {
  const ref = await addDoc(collection(db, "tenants"), {
    name: input.name,
    slug: input.slug,
    plan: input.plan,
    status: "trial",
    ownerName: input.ownerName,
    ownerEmail: input.ownerEmail,
    ownerUid: "",
    studentLimit: input.plan === "starter" ? 200 : input.plan === "standard" ? 1000 : 100000,
    studentCount: 0,
    createdAt: nowIso(),
  });
  return ref.id;
}

export async function updateTenantBranding(tenantId: string, patch: { name?: string; logoUrl?: string }) {
  await updateDoc(doc(db, "tenants", tenantId), patch);
}

export async function setTenantStatus(tenantId: string, status: Tenant["status"]) {
  await updateDoc(doc(db, "tenants", tenantId), { status });
}

export async function updateTenantPlan(tenantId: string, plan: Tenant["plan"]) {
  const studentLimit = plan === "starter" ? 200 : plan === "standard" ? 1000 : 100000;
  await updateDoc(doc(db, "tenants", tenantId), { plan, studentLimit });
}

// ---------- Students ----------

export async function listStudents(tenantId: string): Promise<Student[]> {
  const snap = await getDocs(query(collection(db, "tenants", tenantId, "students"), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, "id">) }));
}

export async function getStudent(tenantId: string, studentId: string): Promise<Student | null> {
  const snap = await getDoc(doc(db, "tenants", tenantId, "students", studentId));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Student, "id">) }) : null;
}

export async function updateStudent(tenantId: string, studentId: string, patch: Partial<Student>) {
  await updateDoc(doc(db, "tenants", tenantId, "students", studentId), patch);
}

// ---------- Teachers ----------

export async function listTeachers(tenantId: string): Promise<Teacher[]> {
  const snap = await getDocs(query(collection(db, "tenants", tenantId, "teachers"), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Teacher, "id">) }));
}

// ---------- Batches ----------

export async function listBatches(tenantId: string): Promise<Batch[]> {
  const snap = await getDocs(query(collection(db, "tenants", tenantId, "batches"), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Batch, "id">) }));
}

export async function getBatch(tenantId: string, batchId: string): Promise<Batch | null> {
  const snap = await getDoc(doc(db, "tenants", tenantId, "batches", batchId));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Batch, "id">) }) : null;
}

export async function createBatch(tenantId: string, input: Omit<Batch, "id" | "tenantId">) {
  const ref = await addDoc(collection(db, "tenants", tenantId, "batches"), { ...input, tenantId });
  return ref.id;
}

// ---------- Attendance ----------

export async function saveAttendance(tenantId: string, record: AttendanceRecord) {
  const id = `${record.batchId}_${record.date}`;
  await setDoc(doc(db, "tenants", tenantId, "attendance", id), record);
}

export async function getAttendance(tenantId: string, batchId: string, date: string): Promise<AttendanceRecord | null> {
  const snap = await getDoc(doc(db, "tenants", tenantId, "attendance", `${batchId}_${date}`));
  return snap.exists() ? (snap.data() as AttendanceRecord) : null;
}

export async function listAttendanceForBatch(tenantId: string, batchId: string): Promise<AttendanceRecord[]> {
  const snap = await getDocs(query(collection(db, "tenants", tenantId, "attendance"), where("batchId", "==", batchId)));
  return snap.docs.map((d) => d.data() as AttendanceRecord);
}

export async function listAttendance(tenantId: string): Promise<AttendanceRecord[]> {
  const snap = await getDocs(query(collection(db, "tenants", tenantId, "attendance"), orderBy("date", "desc")));
  return snap.docs.map((d) => d.data() as AttendanceRecord);
}

export function attendanceSummary(records: AttendanceRecord[], studentId?: string) {
  const marks = records.flatMap((record) => {
    if (studentId) return record.marks[studentId] ? [record.marks[studentId]] : [];
    return Object.values(record.marks);
  });
  const present = marks.filter((mark) => mark === "present").length;
  const late = marks.filter((mark) => mark === "late").length;
  const absent = marks.filter((mark) => mark === "absent").length;
  return {
    total: marks.length,
    present,
    late,
    absent,
    rate: marks.length ? Math.round(((present + late) / marks.length) * 100) : 0,
  };
}

export function buildActivityFeed(
  fees: FeeEntry[],
  notices: Notice[],
  homework: Homework[],
  attendance: AttendanceRecord[],
): ActivityEntry[] {
  return [
    ...notices.map((item) => ({ id: `notice-${item.id}`, type: "notice" as const, title: item.title, detail: item.audienceLabel ?? "All students", createdAt: item.createdAt })),
    ...homework.map((item) => ({ id: `homework-${item.id}`, type: "homework" as const, title: item.title, detail: `Due ${item.dueDate}`, createdAt: item.createdAt })),
    ...fees.map((item) => ({ id: `fee-${item.id}`, type: "fee" as const, title: `${item.studentName ?? "Student"} fee ${item.status}`, detail: `৳${item.amount} · ${item.month}`, createdAt: item.paidAt ?? item.month })),
    ...attendance.map((item) => ({ id: `attendance-${item.batchId}-${item.date}`, type: "attendance" as const, title: `${item.batchName ?? "Batch"} attendance`, detail: `${Object.values(item.marks).filter((mark) => mark === "present").length} present · ${item.date}`, createdAt: item.updatedAt ?? item.date })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
}

// ---------- Fees ----------

export async function listFees(tenantId: string, studentId?: string): Promise<FeeEntry[]> {
  const fees = collection(db, "tenants", tenantId, "fees");
  const feeQuery = studentId
    ? query(fees, where("studentId", "==", studentId), orderBy("month", "desc"))
    : query(fees, orderBy("month", "desc"));
  const snap = await getDocs(feeQuery);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FeeEntry, "id">) }));
}

export async function markFeeStatus(tenantId: string, feeId: string, status: FeeEntry["status"]) {
  await updateDoc(doc(db, "tenants", tenantId, "fees", feeId), {
    status, paidAt: status === "paid" ? nowIso() : null,
  });
}

// ---------- Notices ----------

export async function listNotices(tenantId: string): Promise<Notice[]> {
  const snap = await getDocs(query(collection(db, "tenants", tenantId, "notices"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Notice, "id">) }));
}

export async function createNotice(tenantId: string, input: Omit<Notice, "id" | "tenantId" | "createdAt">) {
  const ref = await addDoc(collection(db, "tenants", tenantId, "notices"), { ...input, tenantId, createdAt: nowIso() });
  return ref.id;
}

// ---------- Homework ----------

export async function listHomework(tenantId: string): Promise<Homework[]> {
  const snap = await getDocs(query(collection(db, "tenants", tenantId, "homework"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Homework, "id">) }));
}

export async function createHomework(tenantId: string, input: Omit<Homework, "id" | "tenantId" | "createdAt">) {
  const ref = await addDoc(collection(db, "tenants", tenantId, "homework"), { ...input, tenantId, createdAt: nowIso() });
  return ref.id;
}

export async function updateHomeworkStatus(tenantId: string, homeworkId: string, archived: boolean) {
  await updateDoc(doc(db, "tenants", tenantId, "homework", homeworkId), {
    archived,
    archivedAt: archived ? nowIso() : null,
    status: archived ? "archived" : "active",
  });
}

const tenantCollection = (tenantId: string, name: string) => collection(db, "tenants", tenantId, name);

export async function listGuardians(tenantId: string): Promise<Guardian[]> {
  const snap = await getDocs(tenantCollection(tenantId, "guardians"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Guardian, "id">) }));
}
export async function listAdmissions(tenantId: string): Promise<Admission[]> {
  const snap = await getDocs(query(tenantCollection(tenantId, "admissions"), orderBy("admittedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Admission, "id">) }));
}
export async function listExams(tenantId: string): Promise<Exam[]> {
  const snap = await getDocs(query(tenantCollection(tenantId, "exams"), orderBy("scheduledAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Exam, "id">) }));
}

export async function updateExam(tenantId: string, examId: string, patch: Partial<Exam>) {
  await updateDoc(doc(db, "tenants", tenantId, "exams", examId), patch);
}

export async function listExamQuestions(tenantId: string, examId: string): Promise<ExamQuestion[]> {
  const snap = await getDocs(query(collection(db, "tenants", tenantId, "exams", examId, "questions"), orderBy("number")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ExamQuestion, "id">) }));
}
export async function listExamResults(tenantId: string, examId?: string, studentId?: string): Promise<ExamResult[]> {
  let q = query(tenantCollection(tenantId, "examResults"), orderBy("rank"));
  if (examId) q = query(tenantCollection(tenantId, "examResults"), where("examId", "==", examId), orderBy("rank"));
  if (studentId) q = query(tenantCollection(tenantId, "examResults"), where("studentId", "==", studentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ExamResult, "id">) }));
}
export async function listPayments(tenantId: string): Promise<PaymentTransaction[]> {
  const snap = await getDocs(query(tenantCollection(tenantId, "payments"), orderBy("createdAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentTransaction, "id">) }));
}
export function buildInsights(students: Student[], fees: FeeEntry[], attendance: AttendanceRecord[], homework: Homework[]): Insight[] {
  const insights: Insight[] = [];
  const due = fees.filter((fee) => fee.status === "due");
  if (due.length) insights.push({ id: "fees-due", severity: due.length > students.length / 2 ? "urgent" : "watch", title: `${due.length} fee entries need follow-up`, detail: `৳${due.reduce((sum, fee) => sum + fee.amount, 0).toLocaleString()} is outstanding.`, source: "fees.status=due", confidence: 1 });
  const marks = Object.values(attendance.flatMap((record) => Object.values(record.marks)));
  const absent = marks.filter((mark) => mark === "absent").length;
  if (absent) insights.push({ id: "attendance-absence", severity: "watch", title: `${absent} absence marks recorded`, detail: "Review students with repeated absences before the next class.", source: "attendance.marks", confidence: 0.92 });
  if (homework.length === 0) insights.push({ id: "homework-empty", severity: "info", title: "No homework is currently published", detail: "Publish an assignment to keep learners engaged between classes.", source: "homework collection", confidence: 0.98 });
  return insights;
}
