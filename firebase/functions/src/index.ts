import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "node:crypto";

initializeApp();
const db = getFirestore();

type Role = "superadmin" | "owner" | "teacher" | "student" | "parent";

const getPlanLimit = (plan: "starter" | "standard" | "premium") =>
  plan === "starter" ? 200 : plan === "standard" ? 1000 : 100000;

function requireRole(auth: { token?: Record<string, unknown> } | undefined, roles: Role[]) {
  const role = auth?.token?.role as Role | undefined;
  if (!auth || !role || !roles.includes(role)) {
    throw new HttpsError("permission-denied", "You don't have access to do this.");
  }
}

/**
 * Self-serve sign-up: an owner has already created their own Firebase Auth
 * account client-side (createUserWithEmailAndPassword). This callable
 * turns that account into the owner of a brand-new tenant and sets their
 * custom claims — the one step only server code (Admin SDK) can do.
 */
export const registerTenant = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign up first, then try again.");
  }

  const { name, slug, plan, ownerName } = request.data as {
    name: string;
    slug: string;
    plan: "starter" | "standard" | "premium";
    ownerName: string;
  };

  if (!name || !slug) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  const existing = await db.collection("tenants").where("slug", "==", slug).get();
  if (!existing.empty) {
    throw new HttpsError("already-exists", "That web address is already taken.");
  }

  const tenantRef = db.collection("tenants").doc();
  const uid = request.auth.uid;
  const email = request.auth.token.email as string;

  await getAuth().setCustomUserClaims(uid, {
    role: "owner",
    tenantId: tenantRef.id,
    tenantSlug: slug,
  });

  await tenantRef.set({
    name,
    slug,
    plan,
    status: "trial",
    ownerUid: uid,
    ownerName: ownerName || email,
    ownerEmail: email,
    studentLimit: getPlanLimit(plan),
    studentCount: 0,
    createdAt: new Date().toISOString(),
  });

  await tenantRef.collection("users").doc(uid).set({
    role: "owner",
    tenantId: tenantRef.id,
    name: ownerName || email,
    email,
    createdAt: new Date().toISOString(),
  });

  return { tenantId: tenantRef.id, slug };
});

/**
 * Super admin onboards a new coaching center: creates the tenant document,
 * an Auth account for the owner, and sets the owner's custom claims so
 * every subsequent Firestore call is scoped to their tenant.
 */
export const createTenant = onCall(async (request) => {
  requireRole(request.auth as never, ["superadmin"]);

  const { name, slug, plan, ownerName, ownerEmail } = request.data as {
    name: string;
    slug: string;
    plan: "starter" | "standard" | "premium";
    ownerName: string;
    ownerEmail: string;
  };

  if (!name || !slug || !ownerEmail) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  const existing = await db.collection("tenants").where("slug", "==", slug).get();
  if (!existing.empty) {
    throw new HttpsError("already-exists", "That slug is already taken.");
  }

  const tenantRef = db.collection("tenants").doc();

  const tempPassword = randomBytes(9).toString("base64url") + "A1!";
  const ownerRecord = await getAuth().createUser({
    email: ownerEmail,
    password: tempPassword,
    displayName: ownerName,
  });

  await getAuth().setCustomUserClaims(ownerRecord.uid, {
    role: "owner",
    tenantId: tenantRef.id,
    tenantSlug: slug,
  });

  await tenantRef.set({
    name,
    slug,
    plan,
    status: "trial",
    ownerUid: ownerRecord.uid,
    ownerName,
    ownerEmail,
    studentLimit: getPlanLimit(plan),
    studentCount: 0,
    createdAt: new Date().toISOString(),
  });

  await tenantRef.collection("users").doc(ownerRecord.uid).set({
    role: "owner",
    tenantId: tenantRef.id,
    name: ownerName,
    email: ownerEmail,
    createdAt: new Date().toISOString(),
  });

  return { tenantId: tenantRef.id, ownerUid: ownerRecord.uid, tempPassword };
});

/**
 * Owner adds a teacher or student: creates their Auth account, sets
 * tenant-scoped custom claims, and returns temp credentials to share.
 */
export const createUser = onCall(async (request) => {
  requireRole(request.auth as never, ["owner"]);
  const tenantId = (request.auth?.token as Record<string, unknown>).tenantId as string;

  const { role, name, email, phone, profile } = request.data as {
    role: "teacher" | "student";
    name: string;
    email: string;
    phone?: string;
    profile?: Record<string, unknown>;
  };

  if (!["teacher", "student"].includes(role) || !name || !email || !profile) {
    throw new HttpsError("invalid-argument", "role must be teacher or student.");
  }

  const tenantRef = db.collection("tenants").doc(tenantId);
  const tenantSnap = await tenantRef.get();
  if (!tenantSnap.exists) {
    throw new HttpsError("not-found", "Tenant not found.");
  }
  const tenantData = tenantSnap.data() ?? {};
  if (tenantData.status === "suspended") {
    throw new HttpsError("failed-precondition", "This coaching center is suspended.");
  }

  if (role === "student") {
    const studentLimit = Number(tenantData.studentLimit ?? 0);
    const studentCount = Number(tenantData.studentCount ?? 0);
    if (studentCount >= studentLimit) {
      throw new HttpsError("resource-exhausted", `This plan has reached its student limit (${studentLimit}). Upgrade the tenant plan or remove inactive students.`);
    }
  }

  const numericRoll = role === "student" && typeof profile.roll === "string" && /^\d+$/.test(profile.roll)
    ? profile.roll
    : null;
  const rollRef = numericRoll
    ? db.collection("tenants").doc(tenantId).collection("rolls").doc(numericRoll)
    : null;
  if (rollRef) {
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(rollRef);
      if (existing.exists) {
        throw new HttpsError("already-exists", `Roll ${numericRoll} is already assigned.`);
      }
      transaction.set(rollRef, { roll: numericRoll, status: "reserved", createdAt: new Date().toISOString() });
    });

  }

  const tempPassword = randomBytes(9).toString("base64url") + "A1!";
  let record;
  try {
    record = await getAuth().createUser({ email, password: tempPassword, displayName: name });
  } catch (error) {
    if (rollRef) await rollRef.delete();
    throw error;
  }

  await getAuth().setCustomUserClaims(record.uid, { role, tenantId, tenantSlug: tenantData.slug });

  await db.collection("tenants").doc(tenantId).collection("users").doc(record.uid).set({
    role,
    tenantId,
    name,
    email,
    phone: phone ?? null,
    createdAt: new Date().toISOString(),
  });

  const profileCollection = role === "student" ? "students" : "teachers";
  const studentDocRef = db.collection("tenants").doc(tenantId).collection(profileCollection).doc(record.uid);
  await studentDocRef.set({
    tenantId,
    name,
    email,
    ...(role === "student" ? { uid: record.uid } : {}),
    ...(phone ? { phone } : {}),
    ...profile,
  });
  if (rollRef) await rollRef.update({ uid: record.uid, status: "assigned" });

  return { uid: record.uid, studentId: record.uid, tempPassword };
});

export const createGuardian = onCall(async (request) => {
  requireRole(request.auth as never, ["owner"]);
  const tenantId = (request.auth?.token as Record<string, unknown>).tenantId as string;
  const { name, email, phone, studentIds } = request.data as { name: string; email: string; phone: string; studentIds: string[] };
  if (!name || !email || !phone || !Array.isArray(studentIds) || !studentIds.length) throw new HttpsError("invalid-argument", "Guardian and at least one student are required.");
  const tempPassword = randomBytes(9).toString("base64url") + "A1!";
  const record = await getAuth().createUser({ email, password: tempPassword, displayName: name });
  const tenant = await db.collection("tenants").doc(tenantId).get();
  await getAuth().setCustomUserClaims(record.uid, { role: "parent", tenantId, tenantSlug: tenant.data()?.slug, linkedStudentIds: studentIds });
  await db.collection("tenants").doc(tenantId).collection("guardians").doc(record.uid).set({ tenantId, name, email, phone, studentIds, status: "invited" });
  await db.collection("tenants").doc(tenantId).collection("users").doc(record.uid).set({ tenantId, role: "parent", name, email, phone, linkedStudentIds: studentIds, createdAt: new Date().toISOString() });
  return { uid: record.uid, tempPassword };
});

export const getParentSnapshot = onCall(async (request) => {
  requireRole(request.auth as never, ["parent"]);
  const token = request.auth?.token as Record<string, unknown>;
  const tenantId = token.tenantId as string;
  const studentIds = Array.isArray(token.linkedStudentIds) ? token.linkedStudentIds as string[] : [];
  if (!studentIds.length) return { students: [], fees: [], attendance: [], homework: [], notices: [] };
  const tenant = db.collection("tenants").doc(tenantId);
  const studentDocs = await Promise.all(studentIds.map((id) => tenant.collection("students").doc(id).get()));
  const students = studentDocs.filter((doc) => doc.exists).map((doc) => ({ id: doc.id, ...(doc.data() as { batchId: string }) }));
  const batchIds = new Set(students.map((student) => student.batchId));
  const [feesSnap, attendanceSnap, homeworkSnap, noticesSnap] = await Promise.all([
    tenant.collection("fees").get(), tenant.collection("attendance").get(), tenant.collection("homework").get(), tenant.collection("notices").get(),
  ]);
  return {
    students,
    fees: feesSnap.docs.filter((doc) => studentIds.includes(doc.data().studentId)).map((doc) => ({ id: doc.id, ...doc.data() })),
    attendance: attendanceSnap.docs.filter((doc) => (doc.data().studentIds ?? []).some((id: string) => studentIds.includes(id))).map((doc) => doc.data()),
    homework: homeworkSnap.docs.filter((doc) => batchIds.has(doc.data().batchId)).map((doc) => ({ id: doc.id, ...doc.data() })),
    notices: noticesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  };
});

export const createAdmission = onCall(async (request) => {
  requireRole(request.auth as never, ["owner"]);
  const tenantId = (request.auth?.token as Record<string, unknown>).tenantId as string;
  const { studentId, amount, paymentStatus, notes } = request.data as { studentId: string; amount: number; paymentStatus: "paid" | "due"; notes?: string };
  if (!studentId || !Number.isFinite(amount) || amount < 0) throw new HttpsError("invalid-argument", "Student and valid amount are required.");
  const receiptNumber = `ADM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const ref = db.collection("tenants").doc(tenantId).collection("admissions").doc();
  await ref.set({ tenantId, studentId, receiptNumber, admittedAt: new Date().toISOString(), amount, paymentStatus: paymentStatus ?? "due", notes: notes ?? "" });
  await db.collection("tenants").doc(tenantId).collection("auditLogs").add({ actorUid: request.auth?.uid, action: "create_admission", targetId: ref.id, createdAt: new Date().toISOString() });
  return { admissionId: ref.id, receiptNumber };
});

export const reviewPayment = onCall(async (request) => {
  requireRole(request.auth as never, ["owner"]);
  const tenantId = (request.auth?.token as Record<string, unknown>).tenantId as string;
  const { paymentId, status } = request.data as { paymentId: string; status: "verified" | "rejected" };
  if (!paymentId || !["verified", "rejected"].includes(status)) throw new HttpsError("invalid-argument", "Invalid payment review.");
  await db.collection("tenants").doc(tenantId).collection("payments").doc(paymentId).update({ status, reviewedBy: request.auth?.uid, reviewedAt: new Date().toISOString() });
  return { ok: true };
});

export const updateTenantPlan = onCall(async (request) => {
  const role = request.auth?.token?.role as Role | undefined;
  if (!request.auth || !role || !["superadmin", "owner"].includes(role)) {
    throw new HttpsError("permission-denied", "You do not have permission to change this plan.");
  }

  const tenantId = role === "superadmin"
    ? (request.data as { tenantId: string }).tenantId
    : ((request.auth.token as Record<string, unknown>).tenantId as string);

  const nextPlan = (request.data as { plan: "starter" | "standard" | "premium" }).plan;
  if (!tenantId || !nextPlan) {
    throw new HttpsError("invalid-argument", "Tenant and plan are required.");
  }

  const tenant = await db.collection("tenants").doc(tenantId).get();
  if (!tenant.exists) {
    throw new HttpsError("not-found", "Tenant not found.");
  }

  const plannedLimit = getPlanLimit(nextPlan);
  const currentStudentCount = Number(tenant.data()?.studentCount ?? 0);
  if (currentStudentCount > plannedLimit) {
    throw new HttpsError("failed-precondition", `This tenant has ${currentStudentCount} students. Keep the current plan or remove students before downgrading.`);
  }
  await db.collection("tenants").doc(tenantId).update({ plan: nextPlan, studentLimit: plannedLimit });
  await db.collection("tenants").doc(tenantId).collection("auditLogs").add({ actorUid: request.auth?.uid, action: "update_plan", payload: { plan: nextPlan }, createdAt: new Date().toISOString() });

  return { ok: true, studentLimit: plannedLimit };
});

export const submitPayment = onCall(async (request) => {
  requireRole(request.auth as never, ["student", "parent", "owner"]);
  const token = request.auth?.token as Record<string, unknown>;
  const tenantId = token.tenantId as string;
  const { studentId, amount, provider, reference } = request.data as { studentId: string; amount: number; provider: string; reference: string };
  const linked = token.linkedStudentIds as string[] | undefined;
  if (!studentId || (token.role === "student" && studentId !== request.auth?.uid) || (token.role === "parent" && !linked?.includes(studentId)) || !Number.isFinite(amount) || !reference) throw new HttpsError("permission-denied", "Payment is not allowed for this learner.");
  const ref = await db.collection("tenants").doc(tenantId).collection("payments").add({ tenantId, studentId, amount, provider: provider || "manual", reference, status: "pending", createdAt: new Date().toISOString() });
  return { paymentId: ref.id };
});

export const executeOwnerCommand = onCall(async (request) => {
  requireRole(request.auth as never, ["owner"]);
  const tenantId = (request.auth?.token as Record<string, unknown>).tenantId as string;
  const { intent, payload, confirmed } = request.data as { intent: string; payload: Record<string, unknown>; confirmed: boolean };
  const allowed = ["create_notice", "create_homework", "mark_fee"];
  if (!allowed.includes(intent)) throw new HttpsError("invalid-argument", "Unsupported command.");
  if (!confirmed) return { preview: true, intent, payload };
  if (intent === "create_notice") {
    if (!payload.title || !payload.body) throw new HttpsError("invalid-argument", "Title and body are required.");
    await db.collection("tenants").doc(tenantId).collection("notices").add({ tenantId, title: payload.title, body: payload.body, audience: "all", audienceLabel: "All students", createdBy: request.auth?.token.name ?? request.auth?.token.email, createdByRole: "owner", createdAt: new Date().toISOString() });
  } else if (intent === "create_homework") {
    if (!payload.batchId || !payload.title || !payload.dueDate) throw new HttpsError("invalid-argument", "Batch, title, and due date are required.");
    await db.collection("tenants").doc(tenantId).collection("homework").add({ tenantId, batchId: payload.batchId, title: payload.title, details: payload.details ?? "", dueDate: payload.dueDate, createdAt: new Date().toISOString() });
  } else {
    if (!payload.feeId || !["paid", "due"].includes(String(payload.status))) throw new HttpsError("invalid-argument", "Fee and status are required.");
    await db.collection("tenants").doc(tenantId).collection("fees").doc(String(payload.feeId)).update({ status: payload.status, paidAt: payload.status === "paid" ? new Date().toISOString() : null });
  }
  await db.collection("tenants").doc(tenantId).collection("auditLogs").add({ actorUid: request.auth?.uid, action: intent, payload, createdAt: new Date().toISOString() });
  return { ok: true };
});

export const suspendTenant = onCall(async (request) => {
  requireRole(request.auth as never, ["superadmin"]);
  const { tenantId } = request.data as { tenantId: string };
  const tenant = await db.collection("tenants").doc(tenantId).get();
  if (!tenant.exists) throw new HttpsError("not-found", "Tenant not found.");

  await db.collection("tenants").doc(tenantId).update({ status: "suspended" });
  await db.collection("tenants").doc(tenantId).collection("auditLogs").add({ actorUid: request.auth?.uid, action: "suspend_tenant", targetId: tenantId, createdAt: new Date().toISOString() });
  const ownerUid = tenant.data()?.ownerUid;
  if (ownerUid) await getAuth().updateUser(ownerUid, { disabled: true });
  return { ok: true };
});

export const activateTenant = onCall(async (request) => {
  requireRole(request.auth as never, ["superadmin"]);
  const { tenantId } = request.data as { tenantId: string };
  const tenant = await db.collection("tenants").doc(tenantId).get();
  if (!tenant.exists) throw new HttpsError("not-found", "Tenant not found.");

  await db.collection("tenants").doc(tenantId).update({ status: "active" });
  await db.collection("tenants").doc(tenantId).collection("auditLogs").add({ actorUid: request.auth?.uid, action: "activate_tenant", targetId: tenantId, createdAt: new Date().toISOString() });
  const ownerUid = tenant.data()?.ownerUid;
  if (ownerUid) await getAuth().updateUser(ownerUid, { disabled: false });
  return { ok: true };
});

export const markFeeStatus = onCall(async (request) => {
  requireRole(request.auth as never, ["owner"]);
  const tenantId = (request.auth?.token as Record<string, unknown>).tenantId as string;
  const { feeId, status } = request.data as { feeId: string; status: "paid" | "due" };

  await db
    .collection("tenants")
    .doc(tenantId)
    .collection("fees")
    .doc(feeId)
    .update({ status, paidAt: status === "paid" ? new Date().toISOString() : null });

  return { ok: true };
});

// Keeps tenants/{tenantId}.studentCount in sync whenever a student doc is
// added or removed, so the super admin dashboard never has to run a count
// query across every tenant.
export const onStudentWrite = onDocumentWritten(
  "tenants/{tenantId}/students/{studentId}",
  async (event) => {
    const { tenantId } = event.params;
    const before = event.data?.before?.exists ?? false;
    const after = event.data?.after?.exists ?? false;
    const delta = after && !before ? 1 : !after && before ? -1 : 0;
    if (delta === 0) return;
    await db.collection("tenants").doc(tenantId).update({
      studentCount: FieldValue.increment(delta),
    });
  }
);
