import { check, clickText, go, selectOption, sleep, startSession, text } from "./lib.mjs";
const { browser, page } = await startSession("eric@ndayitrans.rw");
const iso = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const setDate = (label, v) => page.evaluate((l, val) => {
  const el = [...document.querySelectorAll("label")].find((x) => x.textContent.includes(l))?.querySelector("input");
  if (!el) return false;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, val); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); return true;
}, label, v);
let t;
// conflict: d1 is active on RAD 310A until +2 days
await go(page, "/dashboard/owner/drivers/d1", 2500);
await check("choose truck RAD 310A", await selectOption(page, /^\s*Truck/, /RAD 310A/));
await setDate("Start", iso(0));
await setDate("End", iso(1));
await sleep(1200);
t = await text(page);
await check("overlap warning shown", /overlap|already has|conflict|clash/i.test(t.slice(t.indexOf("Assign to a truck"))));
const blocked = await page.evaluate(() => [...document.querySelectorAll("button")].filter((b) => /^Assign/.test(b.textContent.trim())).every((b) => b.disabled));
await check("assign button disabled while conflicting", blocked);

// clean assignment: d2 on RAD 313D far in the future
await go(page, "/dashboard/owner/drivers/d2", 2500);
await selectOption(page, /^\s*Truck/, /RAD 313D/);
await setDate("Start", iso(40));
await setDate("End", iso(44));
await sleep(900);
await clickText(page, /^Assign/, "button");
await sleep(2500);
t = await text(page);
await check("assignment created and listed as Upcoming", /Upcoming/.test(t));
console.log("ERRORS:", page.errors);
await browser.close();
