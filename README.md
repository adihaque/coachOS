# CoachOS — coaching center management SaaS (MVP)

A working, deployable-anytime MVP for managing coaching centers: multi-tenant
Next.js frontend + Firebase backend (Auth, Firestore, Storage, Cloud Functions).

Design language: "the roll register" — paper backgrounds, stamped ledger
cards, tabular roll numbers, chalkboard green + chalk yellow accents.
Deliberately not the generic AI-website look.

## What's included

- **Marketing site**: landing page, pricing
- **Auth**: login (role-aware redirect), owner self-registration, password reset
- **Super admin portal**: dashboard, coaching list, onboard/suspend/activate coachings
- **Owner portal**: dashboard, students, teachers, batches, attendance, fees,
  notices, CSV reports, branding settings, subscription status
- **Teacher portal**: dashboard, my classes, mark attendance, homework, notices
- **Student portal**: dashboard, attendance, fees, homework, notices
- **Firebase backend**: Firestore security rules enforcing tenant isolation,
  Storage rules, Cloud Functions for tenant/user provisioning
- **Seed script**: one demo coaching + 4 working logins (all four roles)

Full route map and Firebase schema: see `docs/PLAN.md` (the original planning doc).

## Run it locally (5 minutes)

You need Node 20+ and the Firebase CLI (`npm install -g firebase-tools`).

**Terminal 1 — start the Firebase emulators:**
```bash
npm run emulators
```
This starts Auth, Firestore, Storage, and Functions emulators, plus an
inspection UI at http://127.0.0.1:4000. No real Firebase project or
credentials needed — it runs entirely on your machine.

**Terminal 2 — build the Cloud Functions once, so the emulator can serve them:**
```bash
npm install --prefix firebase/functions
npm run functions:build
```
Re-run `npm run functions:build` from the product root whenever you change
`firebase/functions/src/index.ts` — the emulator picks up the compiled
`lib/` output, not the TypeScript source directly. Restart the emulator
after the first build so it picks up the functions.

**Terminal 2 (continued) — seed demo data (first time only, with emulators running):**
```bash
npm install
npm run seed
```
This creates one demo coaching ("Bright Prep Coaching") with a working
login for every role.

Run only one emulator suite at a time. If Terminal 1 already has
`npm run emulators` running on ports 4000, 5001, 8080, 9099, or 9199, do not
run it again in another terminal; run only `npm run seed`. If the suite was
started by another project, stop it first so the seed and frontend cannot
connect to different emulator state.

**Terminal 3 — start the frontend:**
```bash
npm run dev
```
Visit http://localhost:3000. `.env.local` already has
`NEXT_PUBLIC_USE_EMULATOR=true`, so the app talks to your local emulators
automatically.

Run `npm run dev` and `npm run functions:dev` from the product root only.
The first starts Next.js; the second watches and recompiles
`firebase/functions/src` for the emulator. Running `npm run dev` inside
`firebase/functions` is not a frontend command.

For the most reliable browser origin, open `http://localhost:3000`. The
Next.js config also permits the desktop app's changing `169.254.*.*`
link-local origin during development.

### Demo logins (password: `Passw0rd!`)
| Role | Email |
|---|---|
| Super admin | `superadmin@roster.app` |
| Owner | `owner@brightprep.test` |
| Teacher | `teacher@brightprep.test` |
| Student | `student@brightprep.test` |
| Guardian | `parent@brightprep.test` |

#### Guardian access model

Phase 1 keeps one secure read-only performance surface instead of creating a
second privileged role: a parent/guardian uses the student's assigned
credentials (shared by the coaching owner) to view attendance, fees,
homework, notices, batch timing, and progress. Guardians should not use an
owner or teacher account. The seeded parent account demonstrates the
server-verified linked-student model.

### Additional MVP workflows

Owners can invite linked guardian accounts, print admission receipts and
OMR-style answer sheets, create exam shells and view seeded rankings, review
manual payment transaction IDs, inspect explainable attendance/fee insights,
and use the allowlisted command assistant. Gateway adapters are disabled until
credentials and verified webhooks are configured; OMR image recognition is
intentionally not claimed as production-accurate.

## Project structure

```
src/app/                      Next.js App Router pages
  page.tsx                    Marketing landing page
  pricing/, login/, register/, forgot-password/
  superadmin/                 Super admin portal (dashboard, coachings)
  [coaching]/                 Tenant-scoped routes, resolved by URL slug
    owner/  teacher/  student/    One folder per role, each with its own layout

src/lib/
  firebase.ts                 Firebase client init + emulator connection
  data.ts                     All Firestore reads/writes, tenant-scoped
  auth-context.tsx            Session/role/tenant resolution from custom claims
  tenant-context.tsx          Resolves the current tenant from the URL slug
  types.ts                    Shared TypeScript types

src/components/
  ui/                         Button, StampCard, Badge, form fields, etc.
  portal/                     PortalShell (sidebar), RouteGuard, AuthShell

firebase/
  firestore.rules             Tenant-isolation security rules
  storage.rules                Storage security rules
  functions/src/index.ts      Cloud Functions: tenant/user provisioning
  seed/seed.js                 Demo data seeder
```

## Deploying for real

1. **Create a Firebase project** at console.firebase.google.com, enable
   Authentication (Email/Password), Firestore, and Storage. Upgrade to the
   Blaze (pay-as-you-go) plan — required for Cloud Functions.
2. Update `.firebaserc` with your real project ID.
3. Copy `.env.local.example` to `.env.local`, fill in the real
   `NEXT_PUBLIC_FIREBASE_*` values from Project settings, and remove
   `NEXT_PUBLIC_USE_EMULATOR`.
4. Deploy the backend:
   ```bash
   firebase deploy --only firestore:rules,storage:rules,functions
   ```
5. Deploy the frontend to Vercel (recommended) or `firebase deploy --only hosting`
   if you'd rather keep everything on Firebase.
6. Manually create your own super admin account once, in the Firebase
   console → Authentication, then set its custom claims via the Cloud
   Functions shell or a one-off script: `{ role: "superadmin" }`.

## What's deliberately not in this MVP

Teacher payroll, SMS/WhatsApp messaging, online payment gateways
(bKash/Nagad/SSLCommerz), inventory and library modules, multi-branch support,
native mobile apps, and automated OMR image recognition remain outside this
MVP. Manual payments, deterministic insights, printable OMR sheets, and the
read-only guardian surface are included. See `docs/PLAN.md` for the full
phased roadmap.

## Security and local data

This repository contains emulator configuration and intentionally fake demo
accounts only. Never commit `.env.local`, Firebase service-account files,
private keys, payment credentials, or production exports. The checked-in
`.env.local.example` contains placeholders; create a local `.env.local` for
real Firebase configuration when deploying.
