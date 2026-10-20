# iBanga frontend architecture

iBanga is a cargo transport management platform with four roles: **importers**, **truck owners**, **drivers** and **administrators**. This repository is the **frontend only**. There is no backend, database, real authentication, payment gateway or GPS integration. Everything the user sees comes from demonstration data behind a service layer that a real API can later replace.

> Everything on screen that involves money, tracking, verification or settlement is a **simulation**. Do not present it as real.

## Stack

Next.js (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · React Hook Form + Zod (forms) · Leaflet (map). Existing marketplace code (`src/lib/store.tsx`, `src/components/ui.tsx`) is preserved and reused.

## Folder map

```
src/
  app/                    Routes (pages only: thin, compose features and components)
  components/
    ui.tsx                Original shared UI: PageHeader, StatCard, DataTable, Modal, ConfirmDialog, ViewLink, EmptyState, buttons, inputClass
    common/               NEW shared building blocks (see "Shared components")
    dashboard-shell.tsx   Role sidebar (driven by config/navigation.ts)
  config/                 navigation.ts · status.ts · business-rules.ts · permissions.ts · env.ts
  features/               Domain-specific components and workflows (one folder per domain)
  hooks/                  use-ops, use-actor, use-service-query, use-action, use-unread
  lib/                    Marketplace store (users, trucks, bookings, payments, refunds, reviews), formatting, forms, geo, demo data
  mocks/                  Demonstration datasets (one file per domain) and the seed builder
  services/               contracts.ts (interfaces) · mock/* (implementations) · mock-db.ts · index.ts
  types/ops.ts            Domain types for the operations modules
docs/ARCHITECTURE.md      This file
scripts/check-routes.mjs  Verifies every sidebar link has a page (npm run check:routes)
```

## Two data sources, one rule

1. **Marketplace store** (`useIbanga()` from `@/lib/store`): users, trucks, bookings (with embedded payment), refund requests, reviews, current user. Booking status is the coarse source of truth for a trip.
2. **Operations data** (`services` from `@/services`): cargo requests, quotations, drivers and assignments, truck profiles, shipments and milestones, delivery evidence, settlements and payouts, documents and verification requests, cancellations, dispute cases, incidents, insurance, support tickets, notifications, announcements, audit log, reconciliation, admin permissions and settings.

Records link by stable string IDs only (`bookingId`, `truckId`, `ownerId`, ...). `OpsBridge` (mounted in the root layout) copies marketplace data into a directory the mock services read, and creates shipments and settlements for bookings that moved forward from any screen.

### Calling services

Pages never import `mockDb` or `src/mocks`. They use:

```tsx
const actor = useActor();                       // { id, name, role } | null
const query = useServiceQuery(                  // loading / error / refetch, re-runs after any data change
  () => services.shipments.list(actor!, { filters: { status: "DELIVERED" }, pageSize: 200 }),
  [actor?.id],
);
const { run, busy } = useAction();              // busy flag, toasts, double-submit protection
await run(() => services.disputes.open(actor, input), { success: "Dispute opened." });
```

Render with `QueryBoundary` (loading, error with retry, empty). For synchronous joins (counts, selects) `useOps()` returns the whole dataset; derive lists with `useMemo`.

Every service method takes the `actor` and enforces ownership in the mock (an importer cannot read another importer's shipment; an owner cannot touch another owner's records; admin-only actions check role and admin permission). **The backend must enforce the same rules.** Errors are `ServiceError` with a `code` and optional `fieldErrors`; `useAction` shows them as toasts, and `applyFieldErrors` puts them on form fields.

### Mock persistence and reset

`mock-db.ts` holds one `OpsData` object, persisted to `localStorage` (`ibanga-ops-demo`) and exposed through `useSyncExternalStore`. The marketplace store persists separately (`ibanga-demo-session-v1`). **Reset demonstration data** (Settings page and admin System settings) clears both and reloads. Never store real secrets, identity numbers or payment credentials.

### Moving to a real backend

Each method in `services/contracts.ts` has a comment with the endpoint it should become (`GET /cargo-requests`, `POST /quotations/:id/accept`, ...). To integrate: implement the interfaces with HTTP clients, return them from `services/index.ts` when `NEXT_PUBLIC_OPS_DATA_SOURCE=api`, keep `ServiceError` for failures, and replace the marketplace store's demo branches. Requirements the backend must meet:

- Authenticate every request; derive the actor from the session, never from the client.
- Enforce role, ownership and admin-permission rules on every endpoint (the frontend guards are presentation only).
- Make payment, delivery verification and settlement status **server-authoritative**. A payment is not confirmed because a button was clicked; delivery is not verified because a status changed.
- Make accept-quotation, settlement approval, payouts and refunds **idempotent and transactional**.
- Enforce document-expiry restrictions (a truck or driver with an expired required document cannot take work).
- Provide signed upload URLs; the demo reads files into data URLs.
- Support pagination, filtering and sorting server-side (`ListQuery` already models this).

## Business rules (`src/config/business-rules.ts`)

Centralised so they can be replaced by backend results: platform fee (6%), `feeBreakdown`, `netPayable`, `CANCELLATION_POLICY` and `calculateCancellation` (before payment 0% fee; after payment before pickup 10%; after pickup 50%; delivered/disputed cannot be cancelled), `cancellationStageFor`, `evaluateSettlement` (NOT_ELIGIBLE → AWAITING_DELIVERY → AWAITING_VERIFICATION → ON_HOLD → ELIGIBLE), `expiryState`, `effectiveDocumentStatus`, `truckEligibility`, `driverEligibility`. Business rules never live inside presentational components.

## Status system (`src/config/status.ts`)

All labels and colours come from `STATUS_DEFS` through `<StatusBadge family status />`. Tones: success = green, warning = amber, danger = red, neutral = grey, info = blue (in progress), brand = navy (completed). Add new states there, never hard-code colours.

## Shared components (`src/components/common`)

`StatusBadge` · `Notice`, `SimulationNotice`, `DemoTag` · `Section`, `DetailList`, `Timeline`, `BackLink`, `StatGrid` · `FinancialSummary` · `FormField`, `controlClass`, `CheckRow`, `FilePicker` · `SignaturePad` · `QueryBoundary`, `LoadingBlock`, `ErrorBlock` · `ConfirmButton` (confirmation dialog for destructive/financial actions) · `Tabs` · `RoleShell` (route guard + role sidebar) · `PlannedFeature`. From `ui.tsx`: `PageHeader`, `StatCard`, `DataTable` (search, filter, export, pagination), `ViewLink`, `Modal`, `ConfirmDialog`, `EmptyState`, `PrimaryButton`, `GhostButton`, `inputClass`.

## Page recipe

```tsx
"use client";
export default function Page() {
  const actor = useActor();
  const query = useServiceQuery(() => services.x.list(actor!), [actor?.id]);
  return (
    <RoleShell role="IMPORTER">
      <PageHeader eyebrow="..." title="..." subtitle="..." />
      <QueryBoundary query={query} isEmpty={(d) => d.items.length === 0} empty={{ title: "...", text: "..." }}>
        {(data) => <DataTable ... />}
      </QueryBoundary>
    </RoleShell>
  );
}
```

Forms: one Zod schema per form in `src/features/<domain>/schemas.ts`, `useZodForm(schema)`, `FormField` + `controlClass`, submit through `useAction`, map `fieldErrors` back with `applyFieldErrors`. Validate required fields and numeric ranges; never treat an invalid form as submitted. Destructive and money-related actions go through `ConfirmButton` with a summary of what will happen.

## Safety rules the UI must respect

- Quotation ≠ booking ≠ payment. Payment is confirmed only by `booking.payment.status`, never by a click.
- Submitted delivery evidence ≠ verified delivery. A disputed shipment shows its dispute and settlement hold.
- Truck owners never see another owner's private records; importers never see another importer's shipments or payments.
- Expired or unverified documents show clear eligibility warnings and block assignment/quoting.
- Insurance claims are never shown approved or paid unless the simulated state says so. Reconciliation never claims a real provider matched.
- Label simulated money, GPS, verification and settlement. Never show mock coordinates as live vehicle locations.
- No dead buttons or links. Planned features use `PlannedFeature` and say they are not available.

## Route contract

(Existing pages in *italics*.) All role pages use `RoleShell`.

**Public:** `/` · `/about` · `/how-it-works` · `/help` · `/contact` · `/terms` · `/privacy` · `/login` · `/register` · `/forgot-password` · `/reset-password` · `/trucks/[id]` · `/bookings/new`

**Shared (any role):** `/dashboard/notifications` · `/dashboard/settings` · `/dashboard/tracking` and `/dashboard/tracking/[id]` · `/dashboard/future`

**Importer** (`/dashboard/importer/...`): *(root)* · `cargo-requests`, `cargo-requests/new`, `cargo-requests/[id]`, `cargo-requests/[id]/edit` · `shipments`, `shipments/[id]` · *`bookings`*, *`bookings/[id]`*, `bookings/[id]/cancel` · *`payments`*, *`payments/[id]`*, *`payments/[id]/refund`* · *`refunds`* · `disputes`, `disputes/new?booking=<id>`, `disputes/[id]` · `documents` · `support`, `support/new`, `support/[id]` · `reports` · *`profile`*

**Truck owner** (`/dashboard/owner/...`): *(root)* · `opportunities`, `opportunities/[id]` · *`bookings`*, *`bookings/[id]`* · `shipments`, `shipments/[id]` · `delivery-evidence`, `delivery-evidence/[shipmentId]` · *`trucks`*, *`trucks/new`*, *`trucks/[id]`*, *`trucks/[id]/edit`* · `drivers`, `drivers/new`, `drivers/[id]`, `drivers/[id]/edit` · `documents` · `incidents`, `incidents/new?shipment=<id>`, `incidents/[id]` · `earnings`, `earnings/[id]` · `payouts` · *`payments`*, *`payments/[id]`* · *`refunds`*, *`refunds/[id]`* · `disputes`, `disputes/new?booking=<id>`, `disputes/[id]` · `support`, `support/new`, `support/[id]` · `reports` · *`history`* · *`profile`*

**Driver** (`/dashboard/driver/...`): `My trips` (only shipments assigned to the signed-in driver) · shared `notifications`. Drivers can record trip milestones; truck owners and administrators manage driver profiles, documents, truck associations and dated assignments.

**Administrator** (`/dashboard/admin/...`): *(root)* · *`users`* · `verifications`, `verifications/[id]` · *`trucks`*, `trucks/[id]` · `drivers`, `drivers/[id]` · `cargo-requests`, `cargo-requests/[id]` · *`bookings`*, *`bookings/[id]`* · `shipments`, `shipments/[id]` · `incidents`, `incidents/[id]` · `document-expiry` · *`payments`*, *`payments/[id]`* · `settlements`, `settlements/[id]` · `refunds`, `refunds/[id]` · `cancellations`, `cancellations/[id]` · `reconciliation` · *`disputes`*, *`disputes/[id]`* · `insurance-claims` · `support`, `support/[id]` · `reports` · `announcements` · `audit-logs` · `settings` · `admins` · *`profile`*

Sidebar links live in `src/config/navigation.ts`; `npm run check:routes` fails if one has no page.

## Lint rules to respect (React Compiler)

ESLint enforces React Compiler rules. Avoid: `setState` called synchronously inside `useEffect` (derive values during render or set state in async callbacks/handlers); writing to refs during render; unnecessary `useMemo`/`useCallback` whose dependencies the compiler cannot preserve (prefer plain computation unless it is genuinely expensive); components defined inside components.

## Verification

```bash
npm run typecheck      # tsc --noEmit
npx eslint src         # lint (one older warning/error in ui.tsx/store.tsx is known)
npm run check:routes   # every sidebar link resolves
npm run dev            # http://localhost:3000
```

Demo accounts: Admin `admin@ibanga.com` / `admin123`; Importer `jeanine@importco.rw` / `ibanga123`; Truck owner `eric@ndayitrans.rw` / `ibanga123`. Permission-limited admins (password `admin123`): `ops@ibanga.com`, `finance@ibanga.com`, `support@ibanga.com`.
