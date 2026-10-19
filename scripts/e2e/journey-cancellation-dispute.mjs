import { check, clickText, confirmDialog, fillLabel, go, selectOption, startSession, switchUser, text } from "./lib.mjs";

const { browser, page } = await startSession("admin@ibanga.com");
await go(page, "/dashboard/admin/cancellations/cx1", 2500);
await fillLabel(page, /Note for the requester/, "Approved under the after-pickup policy.");
await check("approve clicked", await clickText(page, /^Approve$/, "button"));
await confirmDialog(page);
let t = await text(page);
await check("cancellation Approved", /Approved/.test(t.slice(t.indexOf("Cancellation request"), t.indexOf("Cancellation request") + 200)));
await check("complete clicked", await clickText(page, /Complete/, "button"));
const dlg = await page.evaluate(() => document.querySelector("[role=dialog]")?.innerText ?? "");
console.log("COMPLETE DIALOG: " + dlg.replace(/\n+/g, " | ").slice(0, 400));
await confirmDialog(page);
t = await text(page);
await check("cancellation Completed", /Completed/.test(t));

// importer sees the consequence on the booking and payment
await switchUser(page, "jeanine@importco.rw");
await go(page, "/dashboard/importer/bookings/b2", 2500);
t = await text(page);
await check("booking b2 now Cancelled", /Cancelled/.test(t));
await go(page, "/dashboard/importer/payments/b2", 2500);
t = await text(page);
await check("payment b2 Refunded (simulated)", /Refunded/.test(t));

// dispute decision records without moving money
await switchUser(page, "admin@ibanga.com");
await go(page, "/dashboard/admin/disputes/dc2", 2500);
await check("select decision", await selectOption(page, /Decision/, /Release payment to owner/));
await fillLabel(page, /Reasoning/, "Delay confirmed to be caused by border queue; owner not at fault.");
await clickText(page, /^Record decision and resolve$/, "button");
await confirmDialog(page);
t = await text(page);
await check("dispute now Resolved", /Resolved/.test(t.slice(0, 1200)) || /Resolved/.test(t));
await go(page, "/dashboard/admin/settlements/st1", 2500);
t = await text(page);
await check("settlement no longer held by the dispute", !/An open dispute holds this settlement/.test(t.slice(t.indexOf("Eligibility"), t.indexOf("Eligibility") + 400)));
console.log("ERRORS:", page.errors);
await browser.close();
