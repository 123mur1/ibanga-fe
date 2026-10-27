import puppeteer from "puppeteer-core";

export const BASE = "http://localhost:3000";
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function start() {
  const browser = await puppeteer.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1360, height: 900 },
  });
  return browser;
}

export async function login(browser, email) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !/tile|osrm|ERR_CONNECTION|ERR_INTERNET|ERR_NAME/i.test(m.text())) page.errors.push(m.text().slice(0, 300));
  });
  page.on("pageerror", (e) => page.errors.push("pageerror: " + e.message.slice(0, 300)));
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.evaluate((e) => {
    [...document.querySelectorAll("li")].find((li) => li.textContent?.includes(e))?.querySelector("button")?.click();
  }, email);
  await page.waitForFunction(() => location.pathname.startsWith("/dashboard"), { timeout: 20000 });
  return page;
}

export async function go(page, route, wait = 1500) {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  await sleep(wait);
}

/** Click the first visible button/link whose text matches. Returns true if clicked. */
export async function clickText(page, regex, scope = "button, a, [role=button], label") {
  const clicked = await page.evaluate(
    (source, flags, selector) => {
      const rx = new RegExp(source, flags);
      const visible = (el) => el.offsetParent !== null || el.getClientRects().length > 0;
      const el = [...document.querySelectorAll(selector)].find((node) => rx.test((node.textContent || "").trim()) && visible(node) && !node.disabled);
      if (el) {
        el.click();
        return true;
      }
      return false;
    },
    regex.source,
    regex.flags,
    scope,
  );
  return clicked;
}

export async function text(page) {
  return page.evaluate(() => document.body.innerText);
}

export async function dialogText(page) {
  return page.evaluate(() => document.querySelector("[role=dialog]")?.innerText ?? "");
}

export async function check(label, condition, detail = "") {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}${detail ? "  -> " + detail : ""}`);
  if (!condition) process.exitCode = 1;
  return condition;
}

/** Same browser profile, different account: keeps all demonstration data, changes who is signed in. */
export async function switchUser(page, email) {
  await page.evaluate(() => {
    const key = "ibanga-demo-session-v1";
    const raw = localStorage.getItem(key);
    if (raw) {
      const stored = JSON.parse(raw);
      stored.userId = null;
      localStorage.setItem(key, JSON.stringify(stored));
    }
  });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.evaluate((e) => {
    [...document.querySelectorAll("li")].find((li) => li.textContent?.includes(e))?.querySelector("button")?.click();
  }, email);
  await page.waitForFunction(() => location.pathname.startsWith("/dashboard"), { timeout: 20000 });
}

export async function startSession(email) {
  const browser = await start();
  const page = await login(browser, email);
  return { browser, page };
}

/** Type into the input/textarea inside the first <label> whose text matches. */
export async function fillLabel(page, regex, value, { clear = true } = {}) {
  const handle = await page.evaluateHandle(
    (source, flags) => {
      const rx = new RegExp(source, flags);
      const label = [...document.querySelectorAll("label")].find((node) => rx.test(node.textContent || "") && node.querySelector("input, textarea, select"));
      return label?.querySelector("input, textarea, select") ?? null;
    },
    regex.source,
    regex.flags,
  );
  const element = handle.asElement();
  if (!element) return false;
  if (clear) {
    await element.click({ clickCount: 3 });
    await page.keyboard.press("Backspace");
  }
  await element.type(value);
  return true;
}

/** Sign in through the real form (for accounts without a demo button). */
export async function loginForm(browser, email, password) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push("pageerror: " + e.message.slice(0, 300)));
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type("input[type=email]", email);
  await page.type("input[type=password]", password);
  await clickText(page, /^Continue/, "button[type=submit]");
  await page.waitForFunction(() => location.pathname.startsWith("/dashboard"), { timeout: 20000 });
  return page;
}

export async function switchUserForm(page, email, password) {
  await page.evaluate(() => {
    const key = "ibanga-demo-session-v1";
    const raw = localStorage.getItem(key);
    if (raw) {
      const stored = JSON.parse(raw);
      stored.userId = null;
      localStorage.setItem(key, JSON.stringify(stored));
    }
  });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type("input[type=email]", email);
  await page.type("input[type=password]", password);
  await clickText(page, /^Continue/, "button[type=submit]");
  await page.waitForFunction(() => location.pathname.startsWith("/dashboard"), { timeout: 20000 });
}

/** Choose an option in the <select> inside the label matching `labelRegex`, by visible option text. */
export async function selectOption(page, labelRegex, optionRegex) {
  return page.evaluate(
    (ls, lf, os, of) => {
      const lr = new RegExp(ls, lf);
      const or = new RegExp(os, of);
      const label = [...document.querySelectorAll("label")].find((n) => lr.test(n.textContent || "") && n.querySelector("select"));
      const select = label?.querySelector("select");
      const option = [...(select?.options ?? [])].find((o) => or.test(o.text));
      if (!select || !option) return false;
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
      setter.call(select, option.value);
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    },
    labelRegex.source, labelRegex.flags, optionRegex.source, optionRegex.flags,
  );
}

/** Confirm the open dialog by clicking its primary (last, non-cancel) button. */
export async function confirmDialog(page) {
  await sleep(500);
  const ok = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll("[role=dialog] button")].filter((b) => (b.textContent || "").trim() && !/^(Cancel|Not yet|Back)/i.test(b.textContent.trim()) && !b.getAttribute("aria-label"));
    const button = buttons.at(-1);
    button?.click();
    return Boolean(button);
  });
  await sleep(2000);
  return ok;
}
