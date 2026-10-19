import { BASE, check, clickText, sleep, start, text } from "./lib.mjs";
const browser = await start();
const context = await browser.createBrowserContext();
const page = await context.newPage();
page.errors = [];
page.on("pageerror", (e) => page.errors.push(e.message));
await page.goto(BASE + "/", { waitUntil: "networkidle2" });
await sleep(800);
const count = () => page.evaluate(() => document.querySelectorAll("#available-trucks article").length);
const first = await count();
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await sleep(1500);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await sleep(1500);
const second = await count();
await check("infinite scroll loads more trucks", second > first, `${first} -> ${second}`);

// filters: sidebar stays sticky
const stickyTop = await page.evaluate(() => { const a = document.querySelector("aside[aria-label='Search and filters']"); return a ? getComputedStyle(a).position : "none"; });
await check("filter panel is sticky", stickyTop === "sticky", stickyTop);
await page.evaluate(() => window.scrollTo(0, 0));
await page.type("aside[aria-label='Search and filters'] input[type=search]", "Tanker");
await sleep(800);
let t = await text(page);
await check("search filters the trucks", /of \d+ available trucks/.test(t) && (await count()) <= first);

// public truck page → Send booking → login → back to booking form with quantity
await page.goto(BASE + "/trucks/t3", { waitUntil: "networkidle2" });
await sleep(1500);
await page.evaluate(() => { const i = document.querySelector("#quantity"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, "7"); i.dispatchEvent(new Event("input", { bubbles: true })); });
await clickText(page, /^Send booking$/, "button");
await page.waitForFunction(() => location.pathname === "/login", { timeout: 15000 });
await check("logged-out Send booking goes to login with next", /next=/.test(page.url()), decodeURIComponent(page.url().split("next=")[1] ?? ""));
await page.evaluate(() => { [...document.querySelectorAll("li")].find((li) => li.textContent?.includes("jeanine@importco.rw"))?.querySelector("button")?.click(); });
await page.waitForFunction(() => location.pathname === "/bookings/new", { timeout: 20000 }).catch(() => {});
await sleep(2500);
const url = page.url();
await check("after login lands on the booking form for that truck", /\/bookings\/new\?truck=t3&quantity=7/.test(url), url);
const weight = await page.evaluate(() => [...document.querySelectorAll("label")].find((l) => l.textContent.includes("Weight"))?.querySelector("input")?.value);
await check("weight prefilled with the chosen quantity", weight === "7", String(weight));
console.log("ERRORS:", page.errors);
await browser.close();
