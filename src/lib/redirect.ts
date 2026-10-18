import { dashboardPath } from "./store";
import type { Role } from "./types";

/** Only same-site paths are ever followed after sign-in. */
function isLocalPath(path: string | null): path is string {
  return Boolean(path) && path!.startsWith("/") && !path!.startsWith("//") && !path!.includes("\\");
}

/**
 * Where to send someone after they log in or register: back to the page they
 * left off on when their role may use it, otherwise to their own dashboard.
 */
export function postAuthPath(role: Role, requested: string | null): string {
  const home = dashboardPath(role);
  if (!isLocalPath(requested)) return home;

  const pathname = requested.split(/[?#]/)[0];
  if (pathname === home || pathname.startsWith(`${home}/`)) return requested;
  if (/^\/trucks\/[^/]+$/.test(pathname)) return requested;
  if (pathname === "/bookings/new") {
    if (role === "IMPORTER") return requested;
    // Only importers can book, so everyone else returns to the truck they were looking at.
    const truck = new URLSearchParams(requested.split("?")[1]?.split("#")[0] ?? "").get("truck");
    if (truck && /^[\w-]+$/.test(truck)) return `/trucks/${truck}`;
  }
  return home;
}

/** Query string that carries the "come back to" path from one auth page to the other. */
export function withNext(path: string, next: string | null, extra?: Record<string, string>) {
  const params = new URLSearchParams(extra);
  if (isLocalPath(next)) params.set("next", next);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
