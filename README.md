# iBanga

iBanga is a cargo transport management platform for Rwanda and the region. Importers post cargo requests, compare truck-owner quotations, book, pay, track and confirm delivery. Truck owners register trucks and drivers, quote on cargo, run shipments, submit proof of delivery and get settled. Administrators verify the marketplace, oversee shipments, settlements, refunds, disputes, incidents and reconciliation.

> The frontend connects to the iBanga backend by default. Payments, tracking, verification and settlements shown in the app may still be **simulations**; no money moves.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Set up and run the backend before signing in with database accounts. The
frontend uses `http://localhost:3001` by default; set `NEXT_PUBLIC_API_URL` in
`.env.local` to use a different backend. Production defaults to
`https://ibanga-be.vercel.app`; set `NEXT_PUBLIC_API_URL` in Vercel to override
it. The app always runs against the API; sign in with accounts from the
database (see the backend README for the seeded accounts).

Trip prices are the road distance times the vehicle's rate per kilometre. Set
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (with the Routes API enabled on the key) to
show Google Maps distances while booking; without it the booking page shows an
estimate, and the server prices the trip either way.

Limited administrators see only the sidebar items their role allows; the backend enforces the permissions.

## Checks

```bash
npm run typecheck      # tsc --noEmit
npx eslint src         # lint (React Compiler rules are enabled)
npm run check:routes   # every sidebar link resolves to a real page
npm run build          # production build
```

Real-browser journey checks (quote to settlement, cancellations, disputes, eligibility, access control, forms) live in [`scripts/e2e`](scripts/e2e/README.md).

## What is in the app

- **Public site:** landing page with filterable available trucks (infinite scroll), public truck pages with reviews, how it works, about, help centre, contact, terms, privacy, registration with role selection, login, password reset.
- **Importer:** cargo requests (validated form, drafts, quotation comparison and booking), bookings, shipments and tracking, payments, refunds and cancellations, disputes, documents and verification, notifications, support tickets, reports.
- **Truck owner:** cargo opportunities and quotations, trucks (operational status, documents, eligibility), drivers and assignments, bookings, shipments with milestone controls, proof of delivery, earnings, settlements and payouts, incidents and insurance claims, documents, refunds, disputes, support, performance reports.
- **Administrator:** users, verification requests, trucks, drivers, cargo requests, bookings, shipments and delivery verification, incidents, document expiry, payments, settlements and payouts, refunds, cancellations, reconciliation, disputes, insurance claims, support, reports and analytics, announcements, audit logs, system settings, administrator permissions.
- **Planned (not built):** route optimisation, live GPS, automated matching, predicted arrival, advanced analytics, recurring and multi-stop shipments. They appear as labelled placeholders on `/dashboard/future`.

## Architecture in one minute

```
src/app          routes (thin pages)            src/config      navigation, statuses, business rules, permissions
src/components   shared UI + components/common  src/services    contracts, API clients and the rules layer
src/features     domain components
src/hooks        data and action hooks          src/types       domain types
```

- **Two data sources.** The marketplace store (`src/lib/store.tsx`: users, trucks, bookings with payments, refunds, reviews) and the operations services (`src/services`: cargo requests, quotations, shipments, settlements, documents, disputes, incidents, tickets, notifications, admin data). Records link by stable IDs.
- **Service layer.** Pages talk to `services.*` through hooks. `services/contracts.ts` lists every method. The rules in `services/mock/*` run in the browser against an in-memory cache of API records (`services/mock-db.ts`), and `createPersistedServices` saves every change to the API.
- **Business rules** (fees, cancellation policy, settlement eligibility, document expiry, truck/driver eligibility) live in `src/config/business-rules.ts`, never in presentational components.
- **Statuses** are defined once in `src/config/status.ts` and rendered by `StatusBadge`.
- **Forms** use React Hook Form + Zod; destructive and financial actions use confirmation dialogs.

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for conventions, the route contract and the backend integration checklist.

## Backend data coverage

Marketplace features (authentication, users, trucks, bookings, payments,
refunds and reviews) and cargo requests and quotations use dedicated API
endpoints. The other operations modules are saved to the backend as
operations records.

## Known limitations

- Simulated payment, GPS, verification and settlement behavior is not real money movement or authoritative tracking.
- Frontend route guards and role-based menus are presentation only; the backend must enforce access.
- Uploaded files are read into the browser as data URLs (size-limited); a real build needs an upload service.
- Email, SMS and push notifications are placeholders; only in-app notifications work.
- The map uses OpenStreetMap tiles and the public OSRM service when online and falls back to a straight line.
