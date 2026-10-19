import { check, clickText, fillLabel, go, sleep, startSession, switchUser, text, dialogText } from "./lib.mjs";

const { browser, page } = await startSession("jeanine@importco.rw");
await go(page, "/dashboard/importer/cargo-requests/cr2", 2000);
await clickText(page, /Review and accept/);
await sleep(600);
await page.evaluate(() => document.querySelector("[role=dialog] input[type=checkbox]")?.click());
await clickText(page, /^Accept and create booking$/);
await sleep(2500);
const bookingHref = await page.evaluate(() => [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")).find((h) => /importer\/bookings\/booking-/.test(h || "")));
const bookingId = bookingHref.split("/").pop();
await go(page, bookingHref, 2000);
await clickText(page, /^Pay RWF/);
await sleep(500);
await page.type("[role=dialog] input[inputmode=numeric]", "0788123456");
await clickText(page, /^Pay RWF/, "[role=dialog] button");
await sleep(2500);

await switchUser(page, "eric@ndayitrans.rw");
await go(page, "/dashboard/owner/shipments", 2500);
const hrefs = await page.evaluate(() => [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")));
const shipHref = hrefs.find((h) => /owner\/shipments\/sh-(?!booking)/.test(h || ""));
const shipId = shipHref.split("/").pop();
await go(page, shipHref, 2500);
for (const step of [/^Pickup confirmed$/, /^Cargo loaded$/, /^Departed$/, /^In-transit update$/, /^Arrived$/, /^Unloading$/]) {
  await clickText(page, step, "button");
  await sleep(1000);
}

// Evidence: first try to submit empty and expect validation, never "submitted".
await go(page, `/dashboard/owner/delivery-evidence/${shipId}`, 2500);
await clickText(page, /Review before submitting/, "button");
await sleep(800);
let t = await text(page);
await check("empty evidence is rejected, not submitted", !/awaiting administrator verification/i.test(t) && /required|Enter|Add at least/i.test(t));

await fillLabel(page, /Recipient name/, "Rashid Mwangi");
await fillLabel(page, /confirmation code/i, "DEMO-1234");
await clickText(page, /Use current time/, "button");
const fileInput = await page.$("input[type=file]");
await fileInput.uploadFile("./photo.png");
await sleep(800);
await clickText(page, /Review before submitting/, "button");
await sleep(800);
t = await text(page);

await check("confirm submit clicked", await clickText(page, /^Confirm and submit$/, "button"));
await sleep(2500);
t = await text(page);
await check("shows awaiting verification (not verified)", /awaiting.*verification/i.test(t) && !/Delivery verified/i.test(t));

// Admin verifies
await switchUser(page, "admin@ibanga.com");
await go(page, `/dashboard/admin/shipments/${shipId}`, 2500);
t = await text(page);
const area = t.indexOf("Verify");
console.log("ADMIN AREA: " + t.slice(Math.max(0, area - 100), area + 700));
await check("admin sees 'Submitted, not yet verified'", /not yet verified/i.test(t));

await check("verify clicked", await clickText(page, /^Verify delivery$/, "button"));
await sleep(700);
const vd = await dialogText(page);
console.log("VERIFY DIALOG: " + vd.slice(0, 400));
await clickText(page, /^Verify delivery$|^Confirm|^Yes/, "[role=dialog] button:not([aria-label])");
await sleep(2500);
t = await text(page);
await check("delivery now verified", /Delivery verified/i.test(t));

await go(page, `/dashboard/admin/settlements/st-${bookingId}`, 2500);
t = await text(page);
await check("settlement is Eligible for settlement", /Eligible for settlement/i.test(t));
console.log("ACTIONS: " + t.slice(t.indexOf("Approve") - 50, t.indexOf("Approve") + 300));
await check("approve clicked", await clickText(page, /^Approve/, "button"));
await sleep(700);
console.log("APPROVE DIALOG: " + (await dialogText(page)).slice(0, 500));
await clickText(page, /^Approve|^Confirm/, "[role=dialog] button:not([aria-label])");
await sleep(2500);
t = await text(page);
await check("settlement Processing after approve", /Processing/i.test(t));
await check("mark paid clicked", await clickText(page, /Mark.*paid/i, "button"));
await sleep(700);
console.log("PAID DIALOG: " + (await dialogText(page)).slice(0, 500));
console.log("BUTTONS: " + JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button")].map((b) => b.textContent.trim()))));
await clickText(page, /Mark.*paid|^Confirm/i, "[role=dialog] button:not([aria-label])");
await sleep(2500);
t = await text(page);
console.log("AFTER: " + t.slice(t.indexOf("Status") , t.indexOf("Status") + 300));
console.log("DEBUG paid=" + /Paid/.test(t) + " sim=" + /simulat/i.test(t) + " len=" + t.length);
await check("settlement Paid (simulated)", /Paid/.test(t) && /simulat/i.test(t));
console.log("ERRORS:", page.errors);
console.log("SHIP", shipId, "BOOKING", bookingId);
await browser.close();
