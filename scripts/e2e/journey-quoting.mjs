import { check, clickText, fillLabel, go, selectOption, sleep, startSession, switchUserForm, text } from "./lib.mjs";

const { browser, page } = await startSession("eric@ndayitrans.rw");
const date = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

// 1. Ineligible truck (expired inspection) must be blocked
await go(page, "/dashboard/owner/opportunities/cr11", 2500);
await check("select tanker RAD 092T", await selectOption(page, /^\s*Truck/, /RAD 092T/));
await sleep(600);
let t = await text(page);
await check("warns the truck cannot take new work", /cannot take (new )?work|not eligible|expired/i.test(t));
await fillLabel(page, /Your price/, "1300000");
await page.evaluate((a, b) => {
  const set = (label, v) => { const el = [...document.querySelectorAll("label")].find((l) => l.textContent.includes(label))?.querySelector("input"); if (!el) return; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); };
  set("Estimated pickup date", a); set("Estimated delivery date", b);
}, date(8), date(14));
await clickText(page, /^Send quotation$/, "button");
await sleep(1500);
t = await text(page);
await check("ineligible quote NOT sent", !/Quotation sent|submitted successfully/i.test(t) && /You have not quoted this request yet/.test(t));

// 2. Eligible truck on cr9 (14 t refrigerated need; flatbed RAD 312C 14 t is documented and available)
await go(page, "/dashboard/owner/opportunities/cr9", 2500);
await check("select RAD 312C", await selectOption(page, /^\s*Truck/, /RAD 312C/));
await fillLabel(page, /Your price/, "1200000");
await page.evaluate((a, b) => {
  const set = (label, v) => { const el = [...document.querySelectorAll("label")].find((l) => l.textContent.includes(label))?.querySelector("input"); if (!el) return; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); };
  set("Estimated pickup date", a); set("Estimated delivery date", b);
}, date(7), date(10));
await fillLabel(page, /Notes for the importer/, "Tarpaulin cover, departure at 06:00.");
await clickText(page, /^Send quotation$/, "button");
await sleep(2200);
t = await text(page);
const sent = /QT-2026-\d+/.test(t.slice(t.indexOf("Your quotations on this request")));
await check("eligible quote appears under 'Your quotations'", sent);
console.log(t.slice(t.indexOf("Your quotations on this request"), t.indexOf("Your quotations on this request") + 500).replace(/\n+/g, " | "));

// 3. David sees it and books it
await switchUserForm(page, "david@okellocargo.ug", "ibanga123");
await go(page, "/dashboard/importer/cargo-requests/cr9", 2500);
t = await text(page);
await check("David sees 1 quotation on cr9", /RWF 1,200,000/.test(t) && /Quotation, not a booking/.test(t));
await clickText(page, /Review and accept/);
await sleep(600);
await page.evaluate(() => document.querySelector("[role=dialog] input[type=checkbox]")?.click());
await clickText(page, /^Accept and create booking$/);
await sleep(2500);
t = await text(page);
await check("cr9 booked, payment NOT made", /Booked/.test(t) && /Payment has NOT been made/i.test(t));

// 4. Second accept must not double-book: revisit page, no accept button
await go(page, "/dashboard/importer/cargo-requests/cr9", 2500);
await check("no second accept possible", !(await clickText(page, /Review and accept/)));
console.log("ERRORS:", page.errors);
await browser.close();
