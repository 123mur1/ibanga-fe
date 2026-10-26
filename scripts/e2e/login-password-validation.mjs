import puppeteer from "puppeteer-core";

const BASE = process.env.BASE ?? "http://localhost:3000";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
  defaultViewport: { width: 1360, height: 900 },
});

try {
  const page = await browser.newPage();
  let authRequests = 0;

  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/auth/login") authRequests += 1;
  });

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.waitForSelector('input[type="email"]');

  await page.evaluate(() => {
    const form = document.querySelector("form");
    if (!form) throw new Error("Login form was not found.");
    window.loginValidationEvidence = { submitEvents: 0, invalidEvents: 0 };
    form.addEventListener("submit", () => {
      window.loginValidationEvidence.submitEvents += 1;
    }, true);
    form.addEventListener("invalid", () => {
      window.loginValidationEvidence.invalidEvents += 1;
    }, true);
  });

  await page.type('input[type="email"]', "person@example.com");
  await page.type('input[type="password"]', "short");
  await page.click('button[type="submit"]');

  const evidence = await page.evaluate(() => {
    const form = document.querySelector("form");
    const password = document.querySelector('input[type="password"]');
    if (!form || !password) throw new Error("Login controls were not found.");

    return {
      path: window.location.pathname,
      passwordMinLength: password.minLength,
      passwordValueLength: password.value.length,
      passwordValid: password.validity.valid,
      passwordTooShort: password.validity.tooShort,
      formValid: form.checkValidity(),
      submitEvents: window.loginValidationEvidence.submitEvents,
      invalidEvents: window.loginValidationEvidence.invalidEvents,
    };
  });

  const results = {
    ...evidence,
    authRequests,
    blockedByNativeValidation:
      !evidence.passwordValid
      && !evidence.formValid
      && evidence.submitEvents === 0
      && authRequests === 0,
  };
  console.log(JSON.stringify(results, null, 2));

  if (!results.blockedByNativeValidation) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
