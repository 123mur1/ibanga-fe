import { check, clickText, confirmDialog, fillLabel, go, selectOption, sleep, startSession, switchUser, text } from "./lib.mjs";

const { browser, page } = await startSession("eric@ndayitrans.rw");
await go(page, "/dashboard/owner/documents", 2500);
let t = await text(page);
await check("t6 starts blocked (expired inspection)", /RAD 092T[\s\S]{0,160}Cannot take work/.test(t));
console.log("FORM LABELS:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("form label, label")].map((l) => l.textContent.trim().slice(0, 40)).filter(Boolean).slice(0, 40))));
await check("choose truck RAD 092T", await selectOption(page, /This document is for/, /RAD 092T/));
await sleep(300);
await check("choose type inspection", await selectOption(page, /Document type|^\s*Type/, /inspection/i));
await fillLabel(page, /^\s*Title/, "Inspection certificate RAD 092T renewed");
const setDate = (label, v) => page.evaluate((l, val) => {
  const el = [...document.querySelectorAll("label")].find((x) => x.textContent.includes(l))?.querySelector("input");
  if (!el) return false;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, val); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); return true;
}, label, v);
const iso = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
await setDate("Issue date", iso(-2));
await setDate("Expiry date", iso(300));
await (await page.$("input[type=file]")).uploadFile("./photo.png");
await sleep(600);
await check("upload clicked", await clickText(page, /^Upload document$/, "button"));
await sleep(2500);
t = await text(page);
await check("document now In review", /In review[\s\S]{0,40}1|Pending review/.test(t));
await check("t6 still blocked while pending", /RAD 092T[\s\S]{0,200}Cannot take work/.test(t));

// admin approves the verification request
await switchUser(page, "admin@ibanga.com");
await go(page, "/dashboard/admin/verifications", 2500);
t = await text(page);
const href = await page.evaluate(() => [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")).filter((h) => /verifications\/vr/.test(h || "")));

const newVr = href.find((h) => /vr-/.test(h));
await go(page, newVr, 2500);
t = await text(page);
await check("approve clicked", await clickText(page, /^Approve/, "button"));
await confirmDialog(page);
t = await text(page);
await check("verification Approved", /Approved/.test(t));

await switchUser(page, "eric@ndayitrans.rw");
await go(page, "/dashboard/owner/documents", 2500);
t = await text(page);
await check("t6 can now take work", /RAD 092T[\s\S]{0,160}Can take work/.test(t));
await go(page, "/dashboard/owner/opportunities/cr11", 2500);
await selectOption(page, /^\s*Truck/, /RAD 092T/);
await fillLabel(page, /Your price/, "1300000");
await page.evaluate((a, b) => {
  const set = (label, v) => { const el = [...document.querySelectorAll("label")].find((l) => l.textContent.includes(label))?.querySelector("input"); if (!el) return; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v); el.dispatchEvent(new Event("input", { bubbles: true })); };
  set("Estimated pickup date", a); set("Estimated delivery date", b);
}, iso(8), iso(14));
await clickText(page, /^Send quotation$/, "button");
await sleep(2200);
t = await text(page);
await check("tanker quote accepted by the system after renewal", /QT-2026-\d+/.test(t.slice(t.indexOf("Your quotations on this request"))));
console.log("ERRORS:", page.errors);
await browser.close();
