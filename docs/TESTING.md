# CoachOS launch testing checklist

## Local startup

From the product root:

```bash
npm install
npm install --prefix firebase/functions
npm run functions:build
npm run emulators
# second terminal, product root
npm run seed
# third terminal, product root
npm run dev
```

Only one emulator suite may own ports 4000, 5001, 8080, 9099, and 9199.
Open `http://localhost:3000` for the most reliable browser origin.

## Demo accounts

All seeded accounts use `Passw0rd!`: `superadmin@roster.app`,
`owner@brightprep.test`, `teacher@brightprep.test`,
`student@brightprep.test`, and `parent@brightprep.test`.

## Manual acceptance cases

- Login each role and verify the redirect and tenant boundary.
- Owner: inspect dashboard charts, search/filter students/teachers/batches,
  invite a guardian, create an admission, print a receipt, create an exam,
  print an OMR sheet, review payments, insights, and command preview/confirm.
- Teacher: open a class attendance session, navigate students, mark all,
  save, and confirm the chart changes after reload.
- Student and parent: verify attendance, fees, homework, notices, and
  progress are visible; confirm parent cannot write.
- Superadmin: inspect Operations and a tenant detail, suspend/activate a
  tenant, and confirm audit count changes.
- Security: attempt a tenant document read using a different tenant claim;
  expect Firestore permission denied. Attempt parent access to an unlinked
  student; expect permission denied.

## Automated checks

```bash
npm run lint
npm run build
npm run functions:build
node --check firebase/seed/seed.js
npm run seed
```

After seeding, verify counts for one tenant are approximately 50–100
students in production; the bundled demo intentionally uses 8 students,
3 batches, 2 teachers, 24 attendance records, 32 fees, 4 notices, and 5
homework records. For 2–4 tenants, use separate tenant IDs and verify every
query and callable remains claim-scoped.

## Production readiness notes

Manual payment is launch-ready as a transaction-ID workflow. Gateway
adapters remain disabled until provider credentials and webhook verification
are configured. OMR output is printable and modular, but automated image
scanning is deliberately not claimed. Insights are deterministic and expose
their source metrics; no AI provider is required. Before launch, load-test
Firestore rules/callables with representative 50–100 student tenants,
configure backups/monitoring, and conduct a security review of custom claims
and guardian links.
