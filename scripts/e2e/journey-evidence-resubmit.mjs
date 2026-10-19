import { check, clickText, confirmDialog, fillLabel, go, sleep, startSession, switchUser, text } from "./lib.mjs";

const { browser, page } = await startSession("admin@ibanga.com");
let t;

// A. Evidence rejected then resubmitted
await go(page, "/dashboard/admin/shipments/sh5", 2500);
await fillLabel(page, /Reason for rejection/, "Photos do not show the cargo seal numbers.");
await check("reject evidence clicked", await clickText(page, /^Reject evidence$/, "button"));
await confirmDialog(page);
t = await text(page);
await check("evidence Rejected", /Evidence rejected|rejected/i.test(t));
await switchUser(page, "eric@ndayitrans.rw");
await go(page, "/dashboard/owner/delivery-evidence/sh5", 2500);
t = await text(page);
await check("owner sees the rejection reason", /seal numbers/i.test(t));
await fillLabel(page, /Recipient name/, "David Okello", { clear: true });
await fillLabel(page, /confirmation code/i, "DEMO-5555", { clear: true });
await clickText(page, /Use current time/, "button");
await (await page.$("input[type=file]")).uploadFile("./photo.png");
await sleep(600);
await clickText(page, /Review before submitting/, "button");
await sleep(600);
await clickText(page, /^Confirm and submit$/, "button");
await sleep(2200);
t = await text(page);
await check("resubmitted: awaiting verification again", /awaiting.*verification/i.test(t));

// B. Support ticket round trip
await switchUser(page, "jeanine@importco.rw");
await go(page, "/dashboard/importer/support/new", 2500);
console.log("TICKET LABELS:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("label")].map((l) => l.textContent.trim().slice(0, 30)))));
await fillLabel(page, /Subject/, "Question about my shipment documents");
await fillLabel(page, /Message|Describe/, "Which documents do I need at the Kipevu terminal gate?");
await clickText(page, /Send|Create|Submit|Open ticket/i, "button[type=submit], button");
await sleep(2500);
t = await text(page);
await check("ticket created", /TKT-2026-\d+/.test(t) && /Question about my shipment documents/.test(t));
const ticketPath = await page.evaluate(() => location.pathname);
console.log("ticket at", ticketPath);
await switchUser(page, "support@ibanga.com").catch(() => {});
console.log("ERRORS:", page.errors);
await browser.close();
