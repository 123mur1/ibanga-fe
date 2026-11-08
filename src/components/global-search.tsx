"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { flattenNav, profilePathFor, type NavGroup } from "@/config/navigation";
import { useIsTruckVerified } from "@/hooks/use-truck-verification";
import { useIbanga } from "@/lib/store";
import type { Role } from "@/lib/types";

type Result = { id: string; label: string; detail?: string; href: string; haystack: string };
type Section = { title: string; results: Result[] };

const PER_SECTION = 5;

const roleBase: Record<Role, string> = {
  IMPORTER: "/dashboard/importer",
  TRUCK_OWNER: "/dashboard/owner",
  ADMIN: "/dashboard/admin",
  DRIVER: "/dashboard/driver",
};

function statusLabel(status: string) {
  const text = status.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function matches(haystack: string, words: string[]) {
  return words.every((word) => haystack.includes(word));
}

/** Labels that start with the query come first, then everything else in its original order. */
function rank(results: Result[], query: string) {
  return results
    .map((result, index) => ({ result, index, starts: result.label.toLowerCase().startsWith(query) ? 0 : 1 }))
    .sort((a, b) => a.starts - b.starts || a.index - b.index)
    .map(({ result }) => result);
}

/**
 * Header search across the dashboard: pages in the menu, and the bookings, trucks and (for
 * administrators) users the signed-in person can see. Opens with Ctrl+K or ⌘K from anywhere.
 */
export function GlobalSearch({ role, groups }: { role: Role; groups: NavGroup[] }) {
  const router = useRouter();
  const { bookings, trucks, users, currentUser } = useIbanga();
  const isVerified = useIsTruckVerified();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const base = roleBase[role];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const pages = useMemo<Result[]>(() => {
    const seen = new Set<string>();
    const entries: { href: string; label: string; detail?: string }[] = [
      ...flattenNav(groups).flatMap((item) => [
        { href: item.href, label: item.label },
        ...(item.tabs ?? []).map((tab) => ({ href: tab.href, label: tab.label, detail: item.label })),
      ]),
      { href: "/dashboard/notifications", label: "Notifications" },
      { href: profilePathFor(role), label: "My profile" },
      { href: "/dashboard/settings", label: "Settings" },
      ...(role === "DRIVER" ? [] : [{ href: "/dashboard/wallet", label: "Wallet" }]),
      ...(role === "IMPORTER" ? [] : [{ href: "/trucks", label: "Truck marketplace" }]),
    ];
    return entries
      .filter((entry) => !seen.has(entry.href + entry.label) && seen.add(entry.href + entry.label))
      .map((entry) => ({
        id: `page:${entry.href}:${entry.label}`,
        label: entry.label,
        detail: entry.detail ?? "Page",
        href: entry.href,
        haystack: `${entry.label} ${entry.detail ?? ""}`.toLowerCase(),
      }));
  }, [groups, role]);

  const sections = useMemo<Section[]>(() => {
    const q = query.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    if (!words.length) return [{ title: "Go to", results: pages.slice(0, 8) }];

    const truckById = new Map(trucks.map((truck) => [truck.id, truck]));
    const result: Section[] = [];
    const pick = (title: string, all: Result[]) => {
      const found = rank(all.filter((item) => matches(item.haystack, words)), q);
      if (found.length) result.push({ title, results: found.slice(0, PER_SECTION) });
    };

    pick("Pages", pages);

    if (role !== "DRIVER") {
      pick(
        "Bookings",
        bookings.map((booking) => {
          const truck = truckById.get(booking.truckId);
          const other = users.find((user) => user.id === (role === "IMPORTER" ? truck?.ownerId : booking.importerId));
          const detail = [booking.cargoType, statusLabel(booking.status), truck?.plateNumber, other?.name].filter(Boolean).join(" · ");
          return {
            id: `booking:${booking.id}`,
            label: `${booking.pickupLocation} → ${booking.destination}`,
            detail,
            href: `${base}/bookings/${booking.id}`,
            haystack: `${booking.id} ${booking.pickupLocation} ${booking.destination} ${detail} ${booking.cargoDescription ?? ""} ${booking.payment?.receiptNumber ?? ""}`.toLowerCase(),
          };
        }),
      );
    }

    const visibleTrucks =
      role === "ADMIN"
        ? trucks
        : role === "TRUCK_OWNER"
          ? trucks.filter((truck) => truck.ownerId === currentUser?.id)
          : role === "IMPORTER"
            ? trucks.filter((truck) => truck.status === "AVAILABLE" && isVerified(truck))
            : [];
    pick(
      role === "IMPORTER" ? "Available trucks" : "Trucks",
      visibleTrucks.map((truck) => {
        const detail = [truck.plateNumber, `${truck.capacity} t`, truck.currentLocation, truck.priceRwf != null ? `RWF ${truck.priceRwf.toLocaleString("en-RW")}` : null]
          .filter(Boolean)
          .join(" · ");
        return {
          id: `truck:${truck.id}`,
          label: truck.truckType,
          detail,
          href: role === "IMPORTER" ? `/trucks/${truck.id}` : `${base}/trucks/${truck.id}`,
          haystack: `${truck.truckType} ${detail} ${truck.preferredRoute} ${truck.owner?.name ?? ""} ${statusLabel(truck.status)}`.toLowerCase(),
        };
      }),
    );

    if (role === "ADMIN") {
      pick(
        "Users",
        users.map((user) => ({
          id: `user:${user.id}`,
          label: user.name,
          detail: [user.email, statusLabel(user.role), user.company].filter(Boolean).join(" · "),
          href: `/dashboard/admin/users?q=${encodeURIComponent(user.email)}`,
          haystack: `${user.name} ${user.email} ${user.phone ?? ""} ${user.company ?? ""} ${user.location ?? ""} ${user.role}`.toLowerCase(),
        })),
      );
    }

    // Always offer to carry the search into the full list pages.
    const term = encodeURIComponent(query.trim());
    const more: Result[] = [];
    if (role === "IMPORTER") more.push({ id: "more:trucks", label: `Find trucks matching “${query.trim()}”`, href: `${base}/trucks?q=${term}`, haystack: "" });
    if (role !== "DRIVER") more.push({ id: "more:bookings", label: `Search all bookings for “${query.trim()}”`, href: `${base}/bookings?q=${term}`, haystack: "" });
    if (role === "TRUCK_OWNER" || role === "ADMIN") more.push({ id: "more:trucks", label: `Search all trucks for “${query.trim()}”`, href: `${base}/trucks?q=${term}`, haystack: "" });
    if (role === "ADMIN") more.push({ id: "more:users", label: `Search all users for “${query.trim()}”`, href: `${base}/users?q=${term}`, haystack: "" });
    if (more.length) result.push({ title: "Search in", results: more });
    return result;
  }, [query, pages, trucks, bookings, users, role, base, currentUser?.id, isVerified]);

  const flat = sections.flatMap((section) => section.results);
  const activeIndex = Math.min(active, Math.max(0, flat.length - 1));

  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
  }

  function go(result: Result | undefined) {
    if (!result) return;
    close();
    router.push(result.href);
  }

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((activeIndex + 1) % Math.max(1, flat.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((activeIndex - 1 + flat.length) % Math.max(1, flat.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(flat[activeIndex]);
    } else if (event.key === "Escape") {
      close();
    }
  }

  useEffect(() => {
    document.getElementById(`search-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const placeholder =
    role === "ADMIN"
      ? "Search users, trucks, bookings, pages…"
      : role === "DRIVER"
        ? "Search pages…"
        : "Search bookings, trucks, pages…";

  let optionIndex = -1;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-2.5 text-sm text-muted shadow-soft transition hover:border-brand/30 hover:text-navy md:w-72 md:px-3 lg:w-80"
      >
        <SearchIcon />
        <span className="hidden flex-1 truncate text-left md:block">{placeholder}</span>
        <kbd className="hidden rounded-md border border-line bg-background px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted md:block">Ctrl K</kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="presentation">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={close} />
          <div role="dialog" aria-modal="true" aria-label="Search" className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-card">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <SearchIcon />
              <input
                ref={input}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder={placeholder}
                role="combobox"
                aria-expanded="true"
                aria-controls="global-search-results"
                aria-activedescendant={flat.length ? `search-option-${activeIndex}` : undefined}
                className="h-14 w-full bg-transparent text-base text-navy outline-none placeholder:text-muted/70"
              />
              <button type="button" onClick={close} className="rounded-md border border-line px-1.5 py-0.5 text-[11px] font-semibold text-muted hover:text-navy">
                Esc
              </button>
            </div>

            <div id="global-search-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
              {flat.length ? (
                sections.map((section) => (
                  <div key={section.title} className="mb-1">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{section.title}</p>
                    {section.results.map((result) => {
                      optionIndex += 1;
                      const index = optionIndex;
                      const selected = index === activeIndex;
                      return (
                        <button
                          key={result.id}
                          id={`search-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onMouseMove={() => setActive(index)}
                          onClick={() => go(result)}
                          className={`flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition ${selected ? "bg-brand-soft" : "hover:bg-background"}`}
                        >
                          <span className="w-full truncate text-sm font-semibold text-navy">{result.label}</span>
                          {result.detail ? <span className="w-full truncate text-xs text-muted">{result.detail}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ))
              ) : (
                <p className="px-3 py-10 text-center text-sm text-muted">Nothing matches “{query.trim()}”.</p>
              )}
            </div>

            <div className="hidden items-center gap-4 border-t border-line bg-background/60 px-4 py-2 text-[11px] text-muted sm:flex">
              <span><kbd className="font-semibold">↑ ↓</kbd> to move</span>
              <span><kbd className="font-semibold">Enter</kbd> to open</span>
              <span><kbd className="font-semibold">Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  );
}
