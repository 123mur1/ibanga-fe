# Builder brief (rules for everyone building a module)

You are building part of the iBanga frontend in `C:\Users\mukar\Desktop\ibanga-fe` (Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4). A shared foundation already exists and works. Several people are building different modules **at the same time in the same working tree**.

## Read first (in this order)

1. `docs/ARCHITECTURE.md` (all of it: data flow, services, hooks, components, business rules, safety rules, route contract, lint rules).
2. `src/types/ops.ts`, `src/services/contracts.ts`, `src/config/status.ts`, `src/config/business-rules.ts`.
3. `src/components/common/*`, `src/components/ui.tsx`, `src/hooks/*`.
4. Examples to imitate: `src/components/booking-detail.tsx`, `src/components/payment-detail.tsx`, `src/features/shipments/shipment-view.tsx`, `src/app/dashboard/owner/refunds/page.tsx`, `src/app/dashboard/owner/refunds/[id]/page.tsx`, `src/app/contact/page.tsx` (Zod form).

Match the existing look: cards `rounded-2xl border border-line bg-card shadow-soft`, `PageHeader`, `StatCard`, `DataTable` (client-side search, filter, export, pagination), colour tokens (`brand`, `navy`, `good`, `warn`, `bad`, `muted`, `line`), `StatusBadge` for every status.

## Ownership and shared code

- You own **only** the paths listed in your assignment. Create files freely inside them.
- "You may extend" paths can be edited, additively and carefully. **Re-read a file immediately before editing it**, because someone else (including a human teammate) may have changed it.
- **Do not edit foundation files**: `src/types/*`, `src/services/*`, `src/mocks/*`, `src/config/*`, `src/hooks/*`, `src/components/common/*`, `src/components/ui.tsx`, `src/components/dashboard-shell.tsx`, `src/lib/*`, `docs/*`, `package.json`, `scripts/*`. If something is missing, build a small local helper inside your own feature folder and mention the gap in your report. Do not invent service methods that do not exist; use what is in `contracts.ts`.
- Other builders' unfinished files can make `tsc` show transient errors outside your folders. Ignore those; fix every error in your own files.
- **No git commands.** Do not commit, stash, checkout or reset.
- A dev server is already running at `http://localhost:3100`. Do not start another. Check that your routes compile with `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3100/<route>` (expect 200). Pages are client-rendered behind a demo login, so also review your code carefully for runtime problems (null checks, empty states, hook order).
- No new npm dependencies.

## Quality bar

- Every page: loading state (`QueryBoundary`/`LoadingBlock`), empty state, error state with retry, success feedback (toasts through `useAction`), disabled states while busy, accessible labels, keyboard/focus-visible controls, responsive from phone to desktop.
- Forms: one Zod schema per form in `src/features/<domain>/schemas.ts`, `useZodForm`, `FormField` + `controlClass`, inline field errors, service `fieldErrors` mapped back with `applyFieldErrors`. Never accept an invalid form as submitted. Prevent double submission (`useAction` does this).
- Destructive or financially sensitive actions use `ConfirmButton` with a clear summary of what will happen.
- Quotation ≠ booking ≠ payment. Submitted evidence ≠ verified delivery. A disputed shipment shows its dispute and settlement hold. Expired/unverified documents show eligibility warnings. Label simulated money, GPS, verification, settlement (`SimulationNotice`, `DemoTag`).
- Business rules come from `src/config/business-rules.ts`; do not re-implement them in components. Status labels and colours come from `StatusBadge`; do not hard-code colours.
- No dead buttons or links; use only routes from the route contract in `docs/ARCHITECTURE.md`. Planned-but-unbuilt capability uses `PlannedFeature` and says it is not available.
- Keep pages thin (compose feature components); keep components under roughly 300 lines by splitting. Write code that reads like the surrounding code; comment only where the reason is not obvious (for example a safety rule or a backend requirement).
- Respect the lint rules in the architecture doc (React Compiler): no synchronous `setState` in effects, no ref writes during render, avoid needless `useMemo`/`useCallback`.
- Be efficient: do not re-read files you already read, do not over-engineer, do not build things outside your assignment.

## Done means

1. `npx tsc --noEmit` shows no errors in your files.
2. `npx eslint <your folders>` is clean.
3. Every route in your assignment returns 200 on port 3100.
4. You reply with a **short report** (no code): routes/pages built, notable behaviours, anything incomplete, and any gap you hit in the shared code.
