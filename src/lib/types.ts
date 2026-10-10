export type Role = "superadmin" | "owner" | "teacher" | "student" | "parent";

export type Plan = "starter" | "standard" | "premium";
export type TenantStatus = "trial" | "active" | "suspended";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: Plan;
  status: TenantStatus;
  ownerUid: string;
  ownerName: string;
  ownerEmail: string;
  studentLimit: number;
  studentCount: number;
  createdAt: string;
}

export interface AppUser {
  uid: string;
  tenantId: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  linkedStudentIds?: string[];
}

export interface Guardian {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  studentIds: string[];
  status: "active" | "invited";
}

export interface Admission {
  id: string;
  tenantId: string;
  studentId: string;
  receiptNumber: string;
  admittedAt: string;
  amount: number;
  paymentStatus: "paid" | "due";
  notes?: string;
}

export interface Exam {
  id: string;
  tenantId: string;
  title: string;
  subject: string;
  chapter?: string;
  topic?: string;
  description?: string;
  batchIds: string[];
  teacherId?: string;
  scheduledAt: string;
  totalMarks: number;
  status: "draft" | "published" | "completed";
  publishedAt?: string;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  number: number;
  prompt: string;
  marks: number;
  options?: string[];
  answer?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  rank: number;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  tenantId: string;
  studentId: string;
  provider: "manual" | "bkash" | "nagad" | "rocket" | "sslcommerz";
  amount: number;
  reference: string;
  status: "pending" | "verified" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Insight {
  id: string;
  severity: "info" | "watch" | "urgent";
  title: string;
  detail: string;
  source: string;
  confidence: number;
}

export type StudentStatus = "active" | "inactive";

export interface Student {
  id: string;
  tenantId: string;
  name: string;
  roll: string;
  batchId: string;
  batchName?: string;
  guardianName: string;
  guardianPhone: string;
  address?: string;
  admissionDate: string;
  status: StudentStatus;
  photoUrl?: string;
  uid?: string;
  profileNote?: string;
}

export interface Teacher {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  subjects: string[];
  batchIds: string[];
  status: StudentStatus;
  bio?: string;
}

export interface Batch {
  id: string;
  tenantId: string;
  name: string;
  subject: string;
  timing: string;
  teacherId?: string;
  teacherName?: string;
  studentIds: string[];
}

export type AttendanceMark = "present" | "absent" | "late";

export interface AttendanceRecord {
  date: string;
  batchId: string;
  batchName?: string;
  marks: Record<string, AttendanceMark>;
  updatedAt?: string;
  updatedBy?: string;
  studentIds?: string[];
}

export interface ActivityEntry {
  id: string;
  type: "attendance" | "homework" | "notice" | "fee";
  title: string;
  detail: string;
  createdAt: string;
}

export type FeeStatus = "paid" | "due";

export interface FeeEntry {
  id: string;
  studentId: string;
  studentName?: string;
  month: string;
  amount: number;
  status: FeeStatus;
  paidAt?: string;
  note?: string;
}

export interface Notice {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  audience: "all" | string;
  audienceLabel?: string;
  createdBy: string;
  createdByRole: Role;
  createdAt: string;
}

export interface Homework {
  id: string;
  tenantId: string;
  batchId: string;
  batchName?: string;
  title: string;
  details: string;
  dueDate: string;
  createdAt: string;
  archived?: boolean;
  archivedAt?: string;
  status?: "active" | "archived";
}
