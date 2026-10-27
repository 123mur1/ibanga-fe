import { check, clickText, confirmDialog, fillLabel, go, startSession, switchUserForm, text } from "./lib.mjs";

const bookingId = "b2";
const { browser, page } = await startSession("jeanine@importco.rw");

// b2 is an IN_PROGRESS booking with a seeded HELD payment. Create the refund
// request through the supported importer flow instead of using unpaid b1/r1.
await go(page, `/dashboard/importer/payments/${bookingId}/refund`, 2500);
const beforeRequest = await page.evaluate((id) => {
  const raw = localStorage.getItem("ibanga-demo-session-v1");
  const session = raw ? JSON.parse(raw) : null;
  return session?.session?.bookings?.find((booking) => booking.id === id) ?? null;
}, bookingId);
await check("selected booking has a payment before refund request", beforeRequest?.payment?.status === "HELD", JSON.stringify(beforeRequest?.payment ?? null));
await fillLabel(page, /What happened\?/, "The shipment schedule changed and the held payment should be returned.");
await clickText(page, /^Send refund request$/, "button");
await go(page, "/dashboard/importer/refunds", 1500);
const refundId = await page.evaluate((id) => {
  const raw = localStorage.getItem("ibanga-demo-session-v1");
  const session = raw ? JSON.parse(raw) : null;
  return session?.session?.refunds?.find((refund) => refund.bookingId === id && refund.status === "REQUESTED")?.id ?? null;
}, bookingId);
await check("importer refund request is created", Boolean(refundId), "booking=" + bookingId);

await switchUserForm(page, "amina@coastalhaul.ke", "ibanga123");
await go(page, `/dashboard/owner/refunds/${refundId}`, 2500);
let t = await text(page);
await check("owner sees the importer's refund request", /shipment schedule changed|refund request/i.test(t));
await fillLabel(page, /Note to the importer/, "Approved, rescheduled shipment.");
await clickText(page, /^Approve refund$/, "button");
await confirmDialog(page);
t = await text(page);
const afterApproval = await page.evaluate((id) => {
  const raw = localStorage.getItem("ibanga-demo-session-v1");
  const session = raw ? JSON.parse(raw) : null;
  return {
    refund: session?.session?.refunds?.find((refund) => refund.id === id) ?? null,
    booking: session?.session?.bookings?.find((booking) => booking.id === "b2") ?? null,
  };
}, refundId);
await check("refund status changes to Approved", afterApproval.refund?.status === "APPROVED" && /Approved/.test(t), JSON.stringify(afterApproval.refund ?? null));
await check("approved payment changes to Refunded", afterApproval.booking?.payment?.status === "REFUNDED", JSON.stringify(afterApproval.booking?.payment ?? null));
await check("IN_PROGRESS booking is not cancelled by refund approval", afterApproval.booking?.status === "IN_PROGRESS", "status=" + afterApproval.booking?.status);

await switchUserForm(page, "jeanine@importco.rw", "ibanga123");
await go(page, `/dashboard/importer/payments/${bookingId}`, 2500);
t = await text(page);
await check("importer sees the payment rendered as Refunded", /Refunded/.test(t));
await go(page, `/dashboard/importer/bookings/${bookingId}`, 2500);
t = await text(page);
await check("importer sees the booking is still In progress", /In progress|IN_PROGRESS/i.test(t) && !/Cancelled/.test(t));
console.log("ERRORS:", page.errors);
await browser.close();
