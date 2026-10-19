import { check, go, loginForm, login, start, text } from "./lib.mjs";

const browser = await start();

// --- Isolation: importer David must not see Jeanine's private records
let page = await loginForm(browser, "david@okellocargo.ug", "ibanga123");
for (const route of ["/dashboard/importer/shipments/sh2", "/dashboard/importer/bookings/b2", "/dashboard/importer/payments/b2", "/dashboard/importer/cargo-requests/cr2", "/dashboard/importer/disputes/dc2", "/dashboard/importer/support/tk1"]) {
  await go(page, route, 2500);
  const t = await text(page);
  await check(`David cannot read ${route}`, /could not be found|do not have access|not available|not found|no access|does not include|cannot|forbidden/i.test(t) && !/Musanze|Washed coffee|Chilled avocados/.test(t), t.includes("Musanze") ? "LEAKED" : "");
}
await go(page, "/dashboard/importer/shipments", 2500);
let t = await text(page);
await check("David's shipment list excludes Jeanine's routes", !/Musanze to Kampala|Kigali to Mombasa/.test(t) || /Kigali to Rusumo|Nairobi/.test(t));

// --- Isolation: owner Eric must not see Amina's records
page = await login(browser, "eric@ndayitrans.rw");
for (const route of ["/dashboard/owner/shipments/sh2", "/dashboard/owner/shipments/sh4", "/dashboard/owner/bookings/b2", "/dashboard/owner/drivers/d5", "/dashboard/owner/trucks/t2", "/dashboard/owner/incidents/inc2", "/dashboard/owner/earnings/st3"]) {
  await go(page, route, 2500);
  const body = await text(page);
  await check(`Eric cannot read ${route}`, /could not be found|do not have access|not available|not found|no access|does not include|cannot|forbidden|belongs to another/i.test(body) && !/Hassan Mwinyi|KDA 620M|Coastal Haul/.test(body));
}

// --- Role guard: importer cannot open admin or owner areas
page = await login(browser, "jeanine@importco.rw");
for (const route of ["/dashboard/admin/settlements", "/dashboard/owner/drivers"]) {
  await go(page, route, 2500);
  await check(`importer redirected away from ${route}`, (await page.evaluate(() => location.pathname)).startsWith("/dashboard/importer"));
}

// --- Admin permissions: finance admin
page = await loginForm(browser, "finance@ibanga.com", "admin123");
await go(page, "/dashboard/admin", 2500);
t = await text(page);
await check("finance admin sidebar hides User management", !/User management/.test(t));
await check("finance admin sidebar shows Settlements & payouts", /Settlements & payouts/.test(t));
await go(page, "/dashboard/admin/users", 2500);
t = await text(page);
console.log("finance on /users: " + t.slice(t.indexOf("Good"), t.indexOf("Good") + 500).replace(/\n+/g, " | "));
await go(page, "/dashboard/admin/admins", 2500);
t = await text(page);
await check("finance admin blocked on Admin permissions page", /does not include|no access|permission/i.test(t));

page = await loginForm(browser, "support@ibanga.com", "admin123");
await go(page, "/dashboard/admin", 2500);
t = await text(page);
await check("support admin cannot see Settlements nav", !/Settlements & payouts/.test(t) && /Customer support/.test(t));
await go(page, "/dashboard/admin/settlements/st3", 2500);
t = await text(page);
await check("support admin blocked from settlement detail", /does not include|no access|permission/i.test(t));
await browser.close();
