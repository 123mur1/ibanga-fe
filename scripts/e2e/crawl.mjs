import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SHOTS = process.env.SHOTS ?? "./shots";
mkdirSync(SHOTS, { recursive: true });

const roles = {
  importer: {
    email: "jeanine@importco.rw",
    routes: [
      "/dashboard/importer", "/dashboard/importer/cargo-requests", "/dashboard/importer/cargo-requests/new",
      "/dashboard/importer/cargo-requests/cr1", "/dashboard/importer/cargo-requests/cr2", "/dashboard/importer/cargo-requests/cr2/edit",
      "/dashboard/importer/cargo-requests/cr8", "/dashboard/importer/shipments", "/dashboard/importer/shipments/sh2",
      "/dashboard/importer/shipments/sh4", "/dashboard/importer/shipments/sh6", "/dashboard/importer/bookings",
      "/dashboard/importer/bookings/b2", "/dashboard/importer/bookings/b2/cancel", "/dashboard/importer/bookings/b1/cancel",
      "/dashboard/importer/payments", "/dashboard/importer/payments/b2", "/dashboard/importer/payments/b1/refund",
      "/dashboard/importer/refunds", "/dashboard/importer/disputes", "/dashboard/importer/disputes/new?booking=b2",
      "/dashboard/importer/disputes/dc2", "/dashboard/importer/documents", "/dashboard/importer/support",
      "/dashboard/importer/support/new", "/dashboard/importer/support/tk1", "/dashboard/importer/reports",
      "/dashboard/importer/profile", "/dashboard/notifications", "/dashboard/settings", "/dashboard/tracking",
      "/dashboard/tracking/b2", "/dashboard/future",
    ],
  },
  owner: {
    email: "eric@ndayitrans.rw",
    routes: [
      "/dashboard/owner", "/dashboard/owner/opportunities", "/dashboard/owner/opportunities/cr1", "/dashboard/owner/opportunities/cr2",
      "/dashboard/owner/bookings", "/dashboard/owner/bookings/b1", "/dashboard/owner/shipments", "/dashboard/owner/shipments/sh5",
      "/dashboard/owner/shipments/sh6", "/dashboard/owner/delivery-evidence", "/dashboard/owner/delivery-evidence/sh5",
      "/dashboard/owner/trucks", "/dashboard/owner/trucks/t6", "/dashboard/owner/trucks/t1/edit", "/dashboard/owner/drivers",
      "/dashboard/owner/drivers/new", "/dashboard/owner/drivers/d1", "/dashboard/owner/drivers/d3/edit", "/dashboard/owner/documents",
      "/dashboard/owner/incidents", "/dashboard/owner/incidents/new?shipment=sh6", "/dashboard/owner/incidents/inc1",
      "/dashboard/owner/earnings", "/dashboard/owner/earnings/st4", "/dashboard/owner/payouts", "/dashboard/owner/payments",
      "/dashboard/owner/refunds", "/dashboard/owner/refunds/r1", "/dashboard/owner/disputes", "/dashboard/owner/disputes/new?booking=b5",
      "/dashboard/owner/disputes/dc3", "/dashboard/owner/support", "/dashboard/owner/support/tk2", "/dashboard/owner/reports",
      "/dashboard/owner/history", "/dashboard/owner/profile", "/dashboard/notifications",
    ],
  },
  admin: {
    email: "admin@ibanga.com",
    routes: [
      "/dashboard/admin", "/dashboard/admin/users", "/dashboard/admin/verifications", "/dashboard/admin/verifications/vr1",
      "/dashboard/admin/trucks", "/dashboard/admin/trucks/t5", "/dashboard/admin/drivers", "/dashboard/admin/drivers/d4",
      "/dashboard/admin/cargo-requests", "/dashboard/admin/cargo-requests/cr2", "/dashboard/admin/bookings", "/dashboard/admin/bookings/b2",
      "/dashboard/admin/shipments", "/dashboard/admin/shipments/sh5", "/dashboard/admin/incidents", "/dashboard/admin/incidents/inc1",
      "/dashboard/admin/document-expiry", "/dashboard/admin/payments", "/dashboard/admin/payments/b2", "/dashboard/admin/settlements",
      "/dashboard/admin/settlements/st4", "/dashboard/admin/settlements/st7", "/dashboard/admin/refunds", "/dashboard/admin/refunds/r1",
      "/dashboard/admin/cancellations", "/dashboard/admin/cancellations/cx1", "/dashboard/admin/reconciliation", "/dashboard/admin/disputes",
      "/dashboard/admin/disputes/dc1", "/dashboard/admin/insurance-claims", "/dashboard/admin/support", "/dashboard/admin/support/tk4",
      "/dashboard/admin/reports", "/dashboard/admin/announcements", "/dashboard/admin/audit-logs", "/dashboard/admin/settings",
      "/dashboard/admin/admins", "/dashboard/admin/profile", "/dashboard/wallet", "/dashboard/notifications",
    ],
  },
  public: {
    email: null,
    routes: ["/", "/about", "/how-it-works", "/help", "/contact", "/privacy", "/terms", "/login", "/register", "/forgot-password", "/trucks/t3", "/trucks/truck-u-owner-11"],
  },
};

const IGNORE = [/tile\.openstreetmap/i, /router\.project-osrm/i, /favicon/i, /Download the React DevTools/i, /\[HMR\]/i, /Fast Refresh/i, /ERR_INTERNET_DISCONNECTED/i, /ERR_NAME_NOT_RESOLVED/i, /Failed to load resource.*(osm|osrm)/i];

const only = process.argv[2];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-gpu"], defaultViewport: { width: Number(process.env.VW ?? 1360), height: Number(process.env.VH ?? 900), isMobile: Number(process.env.VW ?? 1360) < 600, hasTouch: Number(process.env.VW ?? 1360) < 600 } });
const summary = [];

for (const [role, config] of Object.entries(roles)) {
  if (only && only !== role) continue;
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  let problems = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !IGNORE.some((rx) => rx.test(message.text()))) problems.push(`console: ${message.text().slice(0, 300)}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${String(error.message).slice(0, 300)}`));

  if (config.email) {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
    const clicked = await page.evaluate((email) => {
      const row = [...document.querySelectorAll("li")].find((item) => item.textContent?.includes(email));
      const button = row?.querySelector("button");
      button?.click();
      return Boolean(button);
    }, config.email);
    if (!clicked) { console.log(`!! ${role}: demo login button not found`); continue; }
    await page.waitForFunction(() => location.pathname.startsWith("/dashboard"), { timeout: 20000 }).catch(() => {});
  }

  for (const route of config.routes) {
    problems = [];
    let status = "ok";
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2", timeout: 45000 });
      await new Promise((resolve) => setTimeout(resolve, 900));
    } catch (error) {
      problems.push(`nav: ${String(error.message).slice(0, 120)}`);
    }
    const info = await page.evaluate(() => ({
      path: location.pathname + location.search,
      h1: document.querySelector("h1")?.textContent?.trim().slice(0, 70) ?? "",
      text: document.body.innerText,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    }));
    const crashed = /This page hit a problem|We hit an unexpected problem|Application error|Unhandled Runtime Error/i.test(info.text);
    const notFound = /We could not find that page/i.test(info.text);
    const loading = /Loading your workspace|Opening your workspace/i.test(info.text);
    const missing = /could not be found|not found|not available on your account|No access|does not include/i.test(info.text);
    if (process.env.VW && info.overflow > 4) problems.push(`horizontal overflow ${info.overflow}px`);
    if (crashed) status = "CRASH";
    else if (notFound) status = "404";
    else if (loading) status = "STUCK-LOADING";
    else if (problems.length) status = "ERRORS";
    else if (missing) status = "missing-record?";
    const redirected = info.path.split("?")[0] !== route.split("?")[0];
    if (redirected && status === "ok") status = `redirected->${info.path}`;
    if (!info.h1 && status === "ok") status = "no-h1";
    summary.push({ role, route, status, h1: info.h1, problems });
    if (process.env.SHOT === role || process.env.SHOT === "all") {
      await page.screenshot({ path: `${SHOTS}/${role}-${route.replace(/[^a-z0-9]+/gi, "_")}.png` });
    }
  }
  await context.close();
}
await browser.close();

const bad = summary.filter((item) => item.status !== "ok");
console.log(`\nChecked ${summary.length} pages. Problems: ${bad.length}\n`);
for (const item of bad) console.log(`[${item.status}] ${item.role} ${item.route}  h1="${item.h1}"\n   ${item.problems.slice(0, 3).join("\n   ")}`);
if (!bad.length) console.log("All pages rendered without crashes or console errors.");
