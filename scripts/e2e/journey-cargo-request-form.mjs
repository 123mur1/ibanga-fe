import { check, clickText, go, sleep, startSession, switchUser, text } from "./lib.mjs";
const { browser, page } = await startSession("jeanine@importco.rw");
const iso = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const setNth = (labelText, value, nth = 0) => page.evaluate((l, v, n) => {
  const labels = [...document.querySelectorAll("label")].filter((x) => x.textContent.trim().startsWith(l) && x.querySelector("input, textarea, select"));
  const el = labels[n]?.querySelector("input, textarea, select");
  if (!el) return false;
  const proto = el.tagName === "SELECT" ? HTMLSelectElement : el.tagName === "TEXTAREA" ? HTMLTextAreaElement : HTMLInputElement;
  if (el.tagName === "SELECT") { const o = [...el.options].find((x) => x.text.includes(v)); if (!o) return false; v = o.value; }
  Object.getOwnPropertyDescriptor(proto.prototype, "value").set.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}, labelText, value, nth);
let t;

await go(page, "/dashboard/importer/cargo-requests/new", 2500);
await clickText(page, /^Publish request$/, "button");
await sleep(1200);
t = await text(page);
await check("empty publish rejected with field errors", /\/dashboard\/importer\/cargo-requests\/new/.test(await page.evaluate(() => location.pathname)) && (t.match(/required|Enter|Choose|must/gi) ?? []).length >= 5, `${(t.match(/required|Enter|Choose|must/gi) ?? []).length} messages`);

// invalid numbers
await setNth("Title", "Rice sacks to Kampala");
await setNth("Weight", "0");
await setNth("Length", "0");
await clickText(page, /^Publish request$/, "button");
await sleep(1000);
t = await text(page);
await check("zero weight/dimensions rejected", /above 0|greater than 0|more than 0|positive|at least/i.test(t));

// draft with only a title is allowed
await go(page, "/dashboard/importer/cargo-requests/new", 2200);
await setNth("Title", "Draft: fertiliser to Rusumo");
await clickText(page, /^Save draft$/, "button");
await sleep(2500);
t = await text(page);
await check("draft saved with only a title", /Draft/.test(t));

// full valid publish
await go(page, "/dashboard/importer/cargo-requests/new", 2200);
await setNth("Title", "Rice sacks to Kampala");
await setNth("Estimated cargo value", "9000000");
await setNth("Description", "Forty tonnes of milled rice in 50kg sacks, palletised and shrink wrapped.");
await setNth("Location", "Kigali", 0);
await setNth("Pickup date", iso(6));
await setNth("Street address", "KG 11 Ave, Kigali industrial zone", 0);
await setNth("Contact name", "Alice Mukamana", 0);
await setNth("Contact phone", "+250788441301", 0);
await setNth("Location", "Kampala", 1);
await setNth("Delivery date", iso(9));
await setNth("Street address", "Kikuubo warehouse 12", 1);
await setNth("Contact name", "Joseph Ssemakula", 1);
await setNth("Contact phone", "+256772440110", 1);
await setNth("Weight", "10");
await setNth("Volume", "22");
await setNth("Minimum truck capacity", "10");
await setNth("Length", "7");
await setNth("Width", "2.3");
await setNth("Height", "2.4");
await setNth("Required truck type", "Box truck");
await setNth("Expected budget", "900000");
await clickText(page, /^Publish request$/, "button");
await sleep(3000);
t = await text(page);
await check("valid request published as Open for quotes", /Open for quotes/.test(t) && /Rice sacks to Kampala/.test(t), (await page.evaluate(() => location.pathname)));
const created = await page.evaluate(() => location.pathname);

await switchUser(page, "eric@ndayitrans.rw");
await go(page, "/dashboard/owner/opportunities", 2800);
t = await text(page);
await check("owner sees the new request in opportunities", /Rice sacks to Kampala/.test(t));
await check("owner does not see the importer's draft", !/Draft: fertiliser/.test(t));
console.log("created:", created, "ERRORS:", page.errors);
await browser.close();
