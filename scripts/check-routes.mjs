#!/usr/bin/env node
/**
 * Verifies that every sidebar link in src/config/navigation.ts points at a real page under
 * src/app, and lists app routes that no sidebar links to. Run with `npm run check:routes`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const appDir = join(root, "src", "app");

function collectPages(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectPages(full, found);
    else if (/^page\.(tsx|ts|jsx|js)$/.test(entry)) found.push(full);
  }
  return found;
}

const routes = collectPages(appDir).map((file) => {
  const segments = relative(appDir, join(file, "..")).split(sep).filter(Boolean);
  return "/" + segments.filter((segment) => !/^\(.*\)$/.test(segment)).join("/");
});

const routeMatchers = routes.map((route) => ({
  route,
  pattern: new RegExp("^" + route.replace(/\[\.\.\.[^\]]+\]/g, ".+").replace(/\[[^\]]+\]/g, "[^/]+") + "/?$"),
}));

const exists = (href) => routeMatchers.some((matcher) => matcher.pattern.test(href));

const navSource = readFileSync(join(root, "src", "config", "navigation.ts"), "utf8");
const constants = Object.fromEntries([...navSource.matchAll(/const (\w+) = "([^"]+)";/g)].map((match) => [match[1], match[2]]));

const hrefs = [...navSource.matchAll(/href:\s*(`[^`]+`|"[^"]+")/g)].map((match) => {
  let value = match[1].slice(1, -1);
  value = value.replace(/\$\{(\w+)\}/g, (_, name) => constants[name] ?? "");
  return value;
});

const missing = [...new Set(hrefs)].filter((href) => {
  const path = href.split(/[?#]/)[0] || "/";
  return !exists(path);
});

const linked = new Set(hrefs.map((href) => href.split(/[?#]/)[0]));
const orphanTopLevel = routes
  .filter((route) => route.startsWith("/dashboard/") && !route.includes("["))
  .filter((route) => !linked.has(route))
  .sort();

console.log(`App routes: ${routes.length}   Sidebar links: ${new Set(hrefs).size}`);
if (orphanTopLevel.length) {
  console.log(`\nDashboard routes not in any sidebar (reachable from other pages):\n  ${orphanTopLevel.join("\n  ")}`);
}
if (missing.length) {
  console.error(`\nMISSING pages for sidebar links (${missing.length}):\n  ${missing.join("\n  ")}`);
  process.exit(1);
}
console.log("\nAll sidebar links resolve to pages.");
