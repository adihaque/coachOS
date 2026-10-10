/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Seeds the Firebase emulator suite with one demo coaching center, four
 * logins (one per role) and enough sample data to click around a working
 * product. Run this AFTER `firebase emulators:start` is already running,
 * in a second terminal:
 *
 *   node firebase/seed/seed.js
 *
 * Demo logins (password for all: Passw0rd!):
 *   superadmin@roster.app   -> Super admin
 *   owner@brightprep.test   -> Owner, "Bright Prep Coaching"
 *   teacher@brightprep.test -> Teacher
 *   student@brightprep.test -> Student
 */

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({ projectId: "demo-roster" });
const auth = getAuth();
const db = getFirestore();

const PASSWORD = "Passw0rd!";

async function upsertUser(email, name, role, tenantId, tenantSlug) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password: PASSWORD, displayName: name });
  }
  await auth.setCustomUserClaims(user.uid, { role, tenantId, tenantSlug });
  return user.uid;
}

async function clearCollection(ref) {
  const snapshot = await ref.get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach((document) => batch.delete(document.ref));
  await batch.commit();
}

async function seed() {
  console.log("Seeding demo data...");

  await upsertUser("superadmin@roster.app", "Roster Admin", "superadmin", null, null);

  const tenantRef = db.collection("tenants").doc("brightprep");
  for (const collectionName of ["users", "students", "teachers", "batches", "attendance", "fees", "notices", "homework", "rolls"]) {
    await clearCollection(tenantRef.collection(collectionName));
  }
  await tenantRef.set({
    name: "Bright Prep Coaching",
    slug: "brightprep",
    plan: "standard",
    status: "active",
    ownerUid: "",
    ownerName: "Farhana Rahman",
    ownerEmail: "owner@brightprep.test",
    studentLimit: 1000,
    studentCount: 8,
    createdAt: new Date().toISOString(),
  });
  const tenantId = tenantRef.id;

  const ownerUid = await upsertUser("owner@brightprep.test", "Farhana Rahman", "owner", tenantId, "brightprep");
  await tenantRef.update({ ownerUid });
  const teacherUid = await upsertUser("teacher@brightprep.test", "Imran Kabir", "teacher", tenantId, "brightprep");
  const teacher2Uid = await upsertUser("sadia@brightprep.test", "Sadia Ahmed", "teacher", tenantId, "brightprep");

  await tenantRef.collection("users").doc(ownerUid).set({
    role: "owner", tenantId, name: "Farhana Rahman", email: "owner@brightprep.test", createdAt: new Date().toISOString(),
  });
  await tenantRef.collection("users").doc(teacherUid).set({
    role: "teacher", tenantId, name: "Imran Kabir", email: "teacher@brightprep.test", createdAt: new Date().toISOString(),
  });
  await tenantRef.collection("users").doc(teacher2Uid).set({
    role: "teacher", tenantId, name: "Sadia Ahmed", email: "sadia@brightprep.test", createdAt: new Date().toISOString(),
  });

  const batchCollection = tenantRef.collection("batches");
  const batchRefs = {
    physics: batchCollection.doc("hsc-physics-a"),
    math: batchCollection.doc("hsc-math-b"),
    english: batchCollection.doc("admission-english"),
  };
  await batchRefs.physics.set({
    tenantId,
    name: "HSC Physics — Batch A",
    subject: "Physics",
    timing: "Sat/Mon/Wed, 5:00–6:30 PM",
    teacherId: teacherUid,
    teacherName: "Imran Kabir",
    studentIds: [],
  });
  await batchRefs.math.set({
    tenantId, name: "HSC Higher Math — Batch B", subject: "Higher Math",
    timing: "Sun/Tue/Thu, 6:30–8:00 PM", teacherId: teacher2Uid,
    teacherName: "Sadia Ahmed", studentIds: [],
  });
  await batchRefs.english.set({
    tenantId, name: "University English — Evening", subject: "English",
    timing: "Fri, 4:00–6:00 PM", teacherId: teacherUid,
    teacherName: "Imran Kabir", studentIds: [],
  });

  await tenantRef.collection("teachers").doc(teacherUid).set({
    tenantId,
    name: "Imran Kabir",
    phone: "+8801711000000",
    email: "teacher@brightprep.test",
    subjects: ["Physics"],
    batchIds: [batchRefs.physics.id, batchRefs.english.id],
    status: "active",
  });
  await tenantRef.collection("teachers").doc(teacher2Uid).set({
    tenantId, name: "Sadia Ahmed", phone: "+8801812000000", email: "sadia@brightprep.test",
    subjects: ["Higher Math", "ICT"], batchIds: [batchRefs.math.id], status: "active",
  });

  const studentSeeds = [
    ["student@brightprep.test", "Nusrat Jahan", "014", batchRefs.physics.id, "Abdul Karim", "+8801811000000", "Mirpur, Dhaka"],
    ["tanvir@brightprep.test", "Tanvir Ahmed", "015", batchRefs.physics.id, "Salma Begum", "+8801911000000", "Dhanmondi, Dhaka"],
    ["rafiul@brightprep.test", "Rafiul Islam", "016", batchRefs.physics.id, "Mizanur Islam", "+8801713000000", "Uttara, Dhaka"],
    ["mahia@brightprep.test", "Mahia Chowdhury", "017", batchRefs.math.id, "Nasrin Chowdhury", "+8801614000000", "Mohammadpur, Dhaka"],
    ["sami@brightprep.test", "Samiul Hasan", "018", batchRefs.math.id, "Rokeya Hasan", "+8801915000000", "Bashundhara, Dhaka"],
    ["jannat@brightprep.test", "Jannat Ara", "019", batchRefs.math.id, "Kamal Uddin", "+8801816000000", "Khilgaon, Dhaka"],
    ["arif@brightprep.test", "Arif Hossain", "020", batchRefs.english.id, "Shirin Hossain", "+8801717000000", "Banani, Dhaka"],
    ["tasmia@brightprep.test", "Tasmia Rahman", "021", batchRefs.english.id, "Moin Rahman", "+8801818000000", "Lalmatia, Dhaka"],
  ];
  const students = [];
  for (const [email, name, roll, batchId, guardianName, guardianPhone, address] of studentSeeds) {
    const uid = await upsertUser(email, name, "student", tenantId, "brightprep");
    const batchName = Object.values(batchRefs).find((ref) => ref.id === batchId).id === batchRefs.physics.id
      ? "HSC Physics — Batch A" : batchId === batchRefs.math.id ? "HSC Higher Math — Batch B" : "University English — Evening";
    await tenantRef.collection("users").doc(uid).set({ role: "student", tenantId, name, email, createdAt: new Date().toISOString() });
    await tenantRef.collection("students").doc(uid).set({
      tenantId, uid, name, roll, batchId, batchName, guardianName, guardianPhone, address,
      admissionDate: "2026-01-10", status: "active",
    });
    students.push({ uid, name, batchId, batchName });
  }
  for (const [batchId, members] of Object.entries({
    [batchRefs.physics.id]: students.filter((s) => s.batchId === batchRefs.physics.id),
    [batchRefs.math.id]: students.filter((s) => s.batchId === batchRefs.math.id),
    [batchRefs.english.id]: students.filter((s) => s.batchId === batchRefs.english.id),
  })) {
    await batchCollection.doc(batchId).update({ studentIds: members.map((s) => s.uid) });
  }
  const parentUid = await upsertUser("parent@brightprep.test", "Abdul Karim", "parent", tenantId, "brightprep");
  const linkedStudentIds = students.slice(0, 2).map((student) => student.uid);
  await getAuth().setCustomUserClaims(parentUid, { role: "parent", tenantId, tenantSlug: "brightprep", linkedStudentIds });
  await tenantRef.collection("guardians").doc(parentUid).set({
    tenantId, name: "Abdul Karim", email: "parent@brightprep.test", phone: "+8801811000000",
    studentIds: linkedStudentIds, status: "active",
  });
  await tenantRef.collection("users").doc(parentUid).set({
    tenantId, role: "parent", name: "Abdul Karim", email: "parent@brightprep.test",
    linkedStudentIds, createdAt: new Date().toISOString(),
  });

  const attendancePatterns = [
    ["2026-08-03", ["present", "present", "late"]],
    ["2026-08-10", ["present", "absent", "present"]],
    ["2026-08-17", ["late", "present", "present"]],
    ["2026-08-24", ["present", "present", "present"]],
    ["2026-08-31", ["absent", "present", "present"]],
    ["2026-09-07", ["present", "late", "present"]],
    ["2026-09-14", ["present", "present", "absent"]],
    ["2026-09-21", ["present", "present", "present"]],
  ];
  for (const [date, marks] of attendancePatterns) {
    for (const [batchId, members] of Object.entries({
      [batchRefs.physics.id]: students.filter((s) => s.batchId === batchRefs.physics.id),
      [batchRefs.math.id]: students.filter((s) => s.batchId === batchRefs.math.id),
      [batchRefs.english.id]: students.filter((s) => s.batchId === batchRefs.english.id),
    })) {
      const batchName = batchId === batchRefs.physics.id ? "HSC Physics — Batch A" : batchId === batchRefs.math.id ? "HSC Higher Math — Batch B" : "University English — Evening";
      const batchMarks = Object.fromEntries(members.map((student, index) => [student.uid, marks[(index + date.length) % marks.length]]));
      await tenantRef.collection("attendance").doc(`${batchId}_${date}`).set({
        date, batchId, batchName, marks: batchMarks, studentIds: members.map((student) => student.uid), updatedAt: `${date}T18:00:00.000Z`, updatedBy: teacherUid,
      });
    }
  }

  const feeMonths = ["2026-06", "2026-07", "2026-08", "2026-09"];
  for (const [studentIndex, student] of students.entries()) {
    for (const [monthIndex, month] of feeMonths.entries()) {
      const paid = (studentIndex + monthIndex) % 3 !== 0;
      await tenantRef.collection("fees").doc(`${student.uid}_${month}`).set({
        studentId: student.uid, studentName: student.name, month, amount: student.batchId === batchRefs.english.id ? 1800 : 1500,
        status: paid ? "paid" : "due", ...(paid ? { paidAt: `${month}-05T10:00:00.000Z` } : {}),
      });
    }
  }

  const notices = [
    ["Monthly assessment schedule published", "Physics and Higher Math assessments will run next week. Check your batch timing.", "all", "All students"],
    ["Class rescheduled — Monday, July 27", "Monday's Physics class moves to 6:30 PM due to a room clash.", batchRefs.physics.id, "Physics batch"],
    ["Guardian meeting this Friday", "Guardians are invited to review attendance and progress with the owner.", "all", "All students"],
    ["English presentation groups", "Bring your presentation outline to the Friday evening class.", batchRefs.english.id, "English batch"],
  ];
  for (const [index, [title, body, audience, audienceLabel]] of notices.entries()) {
    await tenantRef.collection("notices").doc(`notice-${index + 1}`).set({
      tenantId, title, body, audience, audienceLabel, createdBy: "Farhana Rahman", createdByRole: "owner",
      createdAt: `2026-09-${String(24 - index * 3).padStart(2, "0")}T09:00:00.000Z`,
    });
  }

  const homework = [
    [batchRefs.physics.id, "Chapter 4 — Work, Energy & Power", "Solve problems 4.1 through 4.12 from the board book.", "2026-10-12"],
    [batchRefs.physics.id, "Vectors practice set", "Complete the 20-question vector worksheet before Wednesday.", "2026-10-15"],
    [batchRefs.math.id, "Integration drill", "Solve the definite integration practice sheet and show working.", "2026-10-13"],
    [batchRefs.math.id, "Complex numbers revision", "Revise modulus and argument with five worked examples.", "2026-10-17"],
    [batchRefs.english.id, "Presentation outline", "Prepare a three-minute presentation about a local community issue.", "2026-10-16"],
  ];
  for (const [index, [batchId, title, details, dueDate]] of homework.entries()) {
    const batchName = batchId === batchRefs.physics.id ? "HSC Physics — Batch A" : batchId === batchRefs.math.id ? "HSC Higher Math — Batch B" : "University English — Evening";
    await tenantRef.collection("homework").doc(`homework-${index + 1}`).set({
      tenantId, batchId, batchName, title, details, dueDate, createdAt: `2026-09-${String(20 - index).padStart(2, "0")}T12:00:00.000Z`,
    });
  }
  await tenantRef.collection("admissions").doc("admission-nusrat").set({
    tenantId, studentId: students[0].uid, receiptNumber: "ADM-20260110-BP01", admittedAt: "2026-01-10T09:00:00.000Z",
    amount: 2500, paymentStatus: "paid", notes: "Standard admission package",
  });
  const examRef = tenantRef.collection("exams").doc("midterm-physics");
  await examRef.set({ tenantId, title: "HSC Physics Midterm", subject: "Physics", batchIds: [batchRefs.physics.id], scheduledAt: "2026-10-20T17:00:00.000Z", totalMarks: 100, status: "published" });
  await examRef.collection("questions").doc("q1").set({ examId: examRef.id, number: 1, prompt: "State Newton's second law.", marks: 5 });
  await examRef.collection("questions").doc("q2").set({ examId: examRef.id, number: 2, prompt: "Solve the vector problem.", marks: 10 });
  const examScores = [82, 76, 76];
  for (const [index, student] of students.slice(0, 3).entries()) {
    const score = examScores[index];
    await tenantRef.collection("examResults").doc(`${examRef.id}_${student.uid}`).set({
      examId: examRef.id, studentId: student.uid, score, totalMarks: 100, percentage: score,
      grade: score >= 80 ? "A+" : "A", rank: index === 0 ? 1 : 2, updatedAt: "2026-10-21T10:00:00.000Z",
    });
  }
  await tenantRef.collection("payments").doc("payment-nusrat-august").set({
    tenantId, studentId: students[0].uid, provider: "manual", amount: 1500, reference: "BKASH-DEMO-4821",
    status: "pending", createdAt: "2026-10-05T11:00:00.000Z",
  });

  console.log("Done. Demo tenant: brightprep — logins listed at top of this file.");
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
