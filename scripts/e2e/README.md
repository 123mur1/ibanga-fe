# Browser journey checks

Real-browser checks for the critical user journeys, driven by Chrome through `puppeteer-core`.
They are not part of the app bundle and add no dependency to `package.json`.

```bash
npm run dev                                  # keep the app running on http://localhost:3000
cd scripts/e2e
npm i --no-save puppeteer-core               # one time
node crawl.mjs                               # open every page for every role, report crashes and console errors
VW=390 VH=800 node crawl.mjs importer        # same at phone width, also flags horizontal overflow
node journey-quote-to-settlement.mjs         # accept quote, pay, run trip, evidence, verify, settle
```

Each `journey-*.mjs` prints `PASS`/`FAIL` lines. Journeys:

| Script | Covers |
| --- | --- |
| `journey-quote-to-settlement` | quotation accepted, payment held, milestones, proof of delivery (submitted vs verified), admin verification, settlement approval and simulated payout |
| `journey-quoting` | ineligible truck blocked, eligible quote sent, second importer books it, no double booking |
| `journey-cancellation-dispute` | cancellation approved and completed (booking cancelled, payment refunded), dispute decision releases the hold |
| `journey-owner-refund` | owner approves an importer refund request |
| `journey-documents-eligibility` | renewed document, admin verification, truck becomes eligible again and can quote |
| `journey-evidence-resubmit` | admin rejects delivery evidence, owner resubmits; support ticket creation |
| `journey-insurance-claim` | claim filed as Submitted, admin decision shown as simulated |
| `journey-driver-assignment` | scheduling conflict blocks assignment, clean assignment succeeds |
| `journey-cargo-request-form` | invalid form rejected, draft saved, valid request published to owners |
| `journey-access-control` | importers/owners cannot read others' records, role guards, permission-limited admins |
| `journey-public-booking` | infinite scroll, sticky filters, Send booking then login returns to the booking form |

Notes: they use the demo accounts and the browser's localStorage, so they are safe to repeat. Edit the Chrome path in `lib.mjs` if Chrome is installed elsewhere. Run them from this folder; on Git Bash prefix commands that take a URL path argument with `MSYS_NO_PATHCONV=1`.
