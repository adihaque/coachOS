# Coaching Center SaaS — MVP Build Plan (Firebase Backend)

## 0. Philosophy

Your original doc is a v3.0 product. We're building v0.1: the smallest thing a real coaching center would pay for. Everything else goes in the **"Later" backlog** at the bottom — not deleted, just deferred.

**MVP promise to a coaching owner:** "Replace your Excel/register/WhatsApp for students, teachers, attendance, fees, and notices — in one clean dashboard."

**Stack:**
- Frontend: Next.js (App Router) — you're building this on Vercel AI / v0
- Backend: Firebase (Auth, Firestore, Storage, Cloud Functions)
- Hosting: Frontend on Vercel, backend on Firebase (Blaze plan)
- Local dev: Firebase Emulator Suite (Auth + Firestore + Storage + Functions run fully offline)

Dropped entirely for MVP: NestJS, Postgres, Redis, BullMQ, Kubernetes, Meilisearch, OpenCV/OMR microservice, Grafana/Prometheus. Firebase replaces the first six; you don't need infra monitoring at MVP scale.

---

## 1. Multi-Tenancy Model (the core architectural decision)

Two ways to isolate coaching centers. Pick based on how fast you want to launch:

**Option A — Path-based (recommended for MVP):** `yourapp.com/{coachingSlug}/...`
No DNS/SSL wildcard setup needed. Works instantly on Vercel's free tier. Launch in days.

**Option B — Subdomain-based (Phase 2 upgrade):** `{coachingSlug}.yourapp.com`
Looks more "enterprise," but needs wildcard DNS + wildcard SSL + Next.js middleware to read the `Host` header and resolve tenant. Do this once you have paying customers, not before.

Start with A. The URL structure below is written path-based; swapping to subdomains later is a routing change, not a data model change.

**Data isolation:** All tenant data lives under `/tenants/{tenantId}/...` in Firestore. Firebase Auth custom claims (`{ role, tenantId }`) are attached to every user at creation. Firestore Security Rules check `request.auth.token.tenantId == tenantId in path` on every read/write — this is what actually prevents Coaching A from ever seeing Coaching B's data, not the URL.

---

## 2. Roles in the MVP

Keep 4 roles at launch. **Parent portal is deferred** — parents can be given the student's login for now (or a read-only view added in Phase 2). This alone removes a whole portal's worth of frontend work.

1. Super Admin (you)
2. Owner (coaching admin)
3. Teacher
4. Student

---

## 3. Full Sitemap / Routes

Build these one at a time in whatever order you like — I'd suggest Auth → Owner → Teacher → Student → Super Admin, since Owner is where most value lives.

### 3.1 Public / Marketing (no login)
| Route | Purpose | MVP? |
|---|---|---|
| `/` | Landing page, pitch, CTA | ✅ |
| `/pricing` | Plan comparison (Starter/Standard/Premium) | ✅ |
| `/login` | Universal login, redirects by role | ✅ |
| `/register` | Coaching owner signup (starts trial) | ✅ |
| `/forgot-password` | Password reset | ✅ |

### 3.2 Super Admin Portal — `/superadmin/...`
| Route | Purpose | MVP? |
|---|---|---|
| `/superadmin/dashboard` | Total coachings, MRR, active/inactive count | ✅ |
| `/superadmin/coachings` | List all tenants | ✅ |
| `/superadmin/coachings/new` | Manually onboard a coaching | ✅ |
| `/superadmin/coachings/[id]` | View/edit tenant, suspend/activate | ✅ |
| `/superadmin/settings` | Your own account settings | ✅ |
| `/superadmin/support-tickets` | — | ❌ Later |
| `/superadmin/analytics` | Deep usage analytics | ❌ Later |

### 3.3 Owner Portal — `/{coaching}/owner/...`
| Route | Purpose | MVP? |
|---|---|---|
| `/{coaching}/owner/dashboard` | Overview: student count, fees due, today's attendance | ✅ |
| `/{coaching}/owner/students` | List/search students | ✅ |
| `/{coaching}/owner/students/new` | Add student | ✅ |
| `/{coaching}/owner/students/[id]` | Student profile, edit, fee history | ✅ |
| `/{coaching}/owner/teachers` | List teachers | ✅ |
| `/{coaching}/owner/teachers/new` | Add teacher | ✅ |
| `/{coaching}/owner/teachers/[id]` | Teacher profile/edit | ✅ |
| `/{coaching}/owner/batches` | List batches/classes | ✅ |
| `/{coaching}/owner/batches/new` | Create batch | ✅ |
| `/{coaching}/owner/batches/[id]` | Batch detail, assign students/teacher | ✅ |
| `/{coaching}/owner/attendance` | View attendance by batch/date | ✅ |
| `/{coaching}/owner/fees` | Fee overview, mark paid/due | ✅ |
| `/{coaching}/owner/fees/[studentId]` | Individual fee ledger | ✅ |
| `/{coaching}/owner/notices` | List notices | ✅ |
| `/{coaching}/owner/notices/new` | Post notice (text/image/PDF) | ✅ |
| `/{coaching}/owner/reports` | Basic exportable reports (CSV) | ✅ |
| `/{coaching}/owner/settings` | Coaching name, logo, contact info | ✅ |
| `/{coaching}/owner/subscription` | Plan, billing status | ✅ (manual, no gateway yet) |
| `/{coaching}/owner/exams` | Exam system | ❌ Later |
| `/{coaching}/owner/payroll` | Teacher payroll | ❌ Later |
| `/{coaching}/owner/inventory` | Assets | ❌ Later |
| `/{coaching}/owner/library` | Book issue/return | ❌ Later |

### 3.4 Teacher Portal — `/{coaching}/teacher/...`
| Route | Purpose | MVP? |
|---|---|---|
| `/{coaching}/teacher/dashboard` | Today's classes | ✅ |
| `/{coaching}/teacher/classes` | Assigned batches | ✅ |
| `/{coaching}/teacher/attendance/[batchId]` | Mark attendance | ✅ |
| `/{coaching}/teacher/homework` | List homework given | ✅ |
| `/{coaching}/teacher/homework/new` | Assign homework | ✅ |
| `/{coaching}/teacher/notices/new` | Post class notice | ✅ |
| `/{coaching}/teacher/marks/[batchId]` | Exam marks entry | ❌ Later |
| `/{coaching}/teacher/leave` | Leave requests | ❌ Later |

### 3.5 Student Portal — `/{coaching}/student/...`
| Route | Purpose | MVP? |
|---|---|---|
| `/{coaching}/student/dashboard` | Today's classes, quick stats | ✅ |
| `/{coaching}/student/attendance` | Own attendance % | ✅ |
| `/{coaching}/student/fees` | Fee due/paid history | ✅ |
| `/{coaching}/student/homework` | Homework list | ✅ |
| `/{coaching}/student/notices` | Notices feed | ✅ |
| `/{coaching}/student/results` | Exam results | ❌ Later (no exam module yet) |
| `/{coaching}/student/id-card` | Digital ID | ❌ Later |

### 3.6 Parent Portal
Entirely deferred — `/{coaching}/parent/...` ships in Phase 2.

---

## 4. Firebase Backend Plan

### 4.1 Auth
- Email/password via Firebase Auth.
- Custom claims set at account creation via a Cloud Function: `{ role: 'owner'|'teacher'|'student'|'superadmin', tenantId: 'xyz' }`.
- Frontend reads `role` + `tenantId` from the ID token to route users and gate UI.

### 4.2 Firestore structure
```
/tenants/{tenantId}
    name, slug, logoUrl, plan, status, ownerUid, studentLimit, createdAt

/tenants/{tenantId}/users/{uid}
    role, name, email, phone, createdAt   // mirror for fast lookups/lists

/tenants/{tenantId}/students/{studentId}
    name, photo, roll, batchId, guardianName, guardianPhone,
    address, admissionDate, status, uid (linked auth account)

/tenants/{tenantId}/teachers/{teacherId}
    name, phone, subjects, batchIds, uid, status

/tenants/{tenantId}/batches/{batchId}
    name, subject, timing, teacherId, studentIds[]

/tenants/{tenantId}/attendance/{batchId}/records/{date}
    { studentId: 'present'|'absent'|'late', ... }

/tenants/{tenantId}/fees/{studentId}/entries/{feeId}
    month, amount, status: 'paid'|'due', paidAt, note

/tenants/{tenantId}/notices/{noticeId}
    title, body, attachmentUrl, audience: 'all'|batchId, createdAt, createdBy
```

### 4.3 Security Rules (core pattern)
```
match /tenants/{tenantId}/{document=**} {
  allow read, write: if request.auth.token.tenantId == tenantId
                      && request.auth.token.role in ['owner','teacher']; // narrow per collection
}
```
Super admin bypasses tenant scoping with a separate `role == 'superadmin'` check at the top level.

### 4.4 Cloud Functions (MVP set only)
- `createTenant` — super admin creates a coaching → creates tenant doc + owner Auth account + sets custom claims
- `createUser` — owner adds a teacher/student → creates Auth account + Firestore doc + custom claims + (optionally) emails temp password
- `markFeeStatus` — simple callable to toggle paid/due and log timestamp
- `suspendTenant` / `activateTenant` — super admin control, flips tenant `status` and can disable owner's Auth account

Deferred functions: PDF receipt generation, SMS/WhatsApp senders, OMR scoring, payment gateway webhooks.

### 4.5 Storage
```
/tenants/{tenantId}/logo/
/tenants/{tenantId}/notices/
/tenants/{tenantId}/students/{studentId}/photo
```

### 4.6 Local dev → deploy path
1. `firebase init emulators` (Auth, Firestore, Storage, Functions) — build and test fully offline.
2. Frontend `.env.local` points to emulator ports.
3. When ready: `firebase deploy` (Blaze plan required for Functions) for backend; deploy Next.js to Vercel, pointed at the real Firebase project.
4. Custom domain on Vercel; Firebase stays backend-only (cross-origin calls via SDK — no extra config needed).

---

## 5. MVP Feature Checklist (Phase 1 — what you actually ship first)

- [ ] Auth + role-based routing (4 roles)
- [ ] Super admin: create/suspend coaching, view list
- [ ] Owner: student CRUD, teacher CRUD, batch management
- [ ] Attendance (manual, teacher-marked)
- [ ] Fees (manual entry, paid/due status, no payment gateway)
- [ ] Notices (text/image/PDF, in-app only — no SMS/push yet)
- [ ] Homework (assign + view, no submission grading yet)
- [ ] Basic dashboards (counts, simple stats) for all 4 roles
- [ ] Owner settings: coaching name/logo/branding
- [ ] CSV export for students/fees/attendance
- [ ] Subscription status shown to owner (manually toggled by you — no gateway)

## 6. Explicitly Deferred (Phase 2+)

- Exam system (creation, question papers, OMR generation & scanning)
- Result analytics, ranking, leaderboard
- Teacher payroll, teacher performance reviews
- Parent portal
- SMS / WhatsApp / push notifications
- bKash / Nagad / Rocket / SSLCommerz payment integration
- PDF fee receipts, admit cards, digital ID, certificates
- Inventory & library modules
- Multi-branch support
- AI insights (at-risk student prediction, recommendations)
- Mobile apps
- API access / white-label
- 2FA, audit logs, subdomain-per-tenant routing

---

## 7. Suggested Build Order

1. Firebase project setup + emulator suite + Auth with custom claims
2. Auth pages (`/login`, `/register`, `/forgot-password`) + role-based redirect
3. Super admin: create tenant flow (this unblocks everything else — you need at least one coaching to test with)
4. Owner: students, teachers, batches (core data entry)
5. Owner + Teacher: attendance
6. Owner + Student: fees
7. Notices (all roles)
8. Homework (teacher + student)
9. Dashboards last, once real data exists to summarize
10. Polish, deploy, onboard your first real coaching center

Send me frontend pages as you build them (from v0/Vercel AI) and I'll wire each one to the matching Firebase structure above — Firestore queries, security rules, and Cloud Functions — one page at a time.
