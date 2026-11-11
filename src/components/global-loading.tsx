"use client";

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { requestActivity } from "@/lib/api";
import { LoadingTruck } from "@/components/loading";

/** Wait this long before showing anything, so quick requests do not flash the bar. */
const SHOW_DELAY_MS = 200;
/** Stop waiting for a page that never arrives (a cancelled or failed navigation). */
const NAVIGATION_TIMEOUT_MS = 15_000;

function useNavigationPending() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const here = `${pathname}?${search}`;
  // The address the user clicked away from. Once the address changes the new page has arrived,
  // so no effect is needed to switch the indicator off.
  const [leaving, setLeaving] = useState<string | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setLeaving(`${window.location.pathname}?${window.location.search.replace(/^\?/, "")}`);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (leaving === null) return;
    const timer = window.setTimeout(() => setLeaving(null), NAVIGATION_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  return leaving !== null && leaving === here;
}

function LoadingIndicator() {
  const requests = useSyncExternalStore(requestActivity.subscribe, requestActivity.getSnapshot, requestActivity.getServerSnapshot);
  const navigating = useNavigationPending();
  const busy = requests > 0 || navigating;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(busy), busy ? SHOW_DELAY_MS : 0);
    return () => window.clearTimeout(timer);
  }, [busy]);

  const shown = busy && visible;
  return (
    <div aria-hidden={!shown} className={`pointer-events-none fixed inset-x-0 top-0 z-100 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}>
      <div className="relative h-1 overflow-visible bg-brand/15">
        <div className="loading-bar h-full rounded-full bg-brand" />
        <div className="ibanga-global-truck absolute -top-3 left-0 z-10">
          <LoadingTruck className="h-7 w-14 drop-shadow-sm" />
        </div>
      </div>
      <div className="flex justify-center pt-2">
        <span role="status" aria-live="polite" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-navy px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-navy/20">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" aria-hidden="true" />
          {shown ? (navigating ? "Opening page…" : "Loading…") : ""}
        </span>
      </div>
    </div>
  );
}

/**
 * A loading bar across the top of every page while the app waits: for the server to answer, or
 * for a page the user clicked to open. Mounted once in the root layout.
 */
export function GlobalLoading() {
  return (
    <Suspense fallback={null}>
      <LoadingIndicator />
    </Suspense>
  );
}
