"use client";

import { Suspense, useMemo } from "react";
import { LoadingBlock } from "@/components/common/async-state";
import Link from "next/link";
import { BookingBadge } from "@/components/status-badge";
import { PersonName } from "@/components/photos";
import { BarChartCard, DonutCard, LineChartCard, StatusBars, bucketByMonth } from "@/components/charts";
import { AdminPage } from "@/features/admin-platform/admin-page";
import { useToast } from "@/components/toast";
import { DataTable, PageHeader, StatCard, ViewLink, formatDate, inputClass } from "@/components/ui";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";
import { useOps } from "@/hooks/use-ops";
import { CARGO_TYPES, LOCATIONS, PAYMENT_METHODS, TRUCK_TYPES, canonicalPlace, type Booking, type BookingStatus } from "@/lib/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const STATUSES: BookingStatus[] = ["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERED", "COMPLETED", "DISPUTED", "REJECTED", "CANCELLED"];

const STATUS_SLICES: { status: BookingStatus; label: string; color: string }[] = [
  { status: "PENDING", label: "Pending", color: "#cfe6ef" },
  { status: "ACCEPTED", label: "Accepted", color: "#a3cfe0" },
  { status: "IN_PROGRESS", label: "In progress", color: "#5aa3c0" },
  { status: "DELIVERED", label: "Delivered", color: "#00628b" },
  { status: "COMPLETED", label: "Completed", color: "#0a3d50" },
  { status: "DISPUTED", label: "Disputed", color: "#122832" },
  { status: "REJECTED", label: "Rejected", color: "#d5e0e7" },
  { status: "CANCELLED", label: "Cancelled", color: "#e8eef2" },
];

/** Every filter lives in the address, so a filtered view can be bookmarked or shared. */
const FILTER_KEYS = ["from", "to", "status", "cargo", "truckType", "method", "paid", "start", "end"] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

const PAYMENT_STATES = [
  { value: "UNPAID", label: "Not paid yet" },
  { value: "HELD", label: "Held in escrow" },
  { value: "RELEASED", label: "Released to owner" },
  { value: "REFUNDED", label: "Refunded" },
];

const selectClass = `${inputClass} py-2 text-sm`;

/** What the booking is worth: the amount paid, otherwise the agreed price. */
const bookingValue = (booking: Booking) => booking.payment?.amountRwf ?? booking.agreedPriceRwf ?? 0;
const routeOf = (booking: Booking) => `${canonicalPlace(booking.pickupLocation)} — ${canonicalPlace(booking.destination)}`;

/** Counts per label, largest first. */
function tally(items: Booking[], key: (booking: Booking) => string, limit = 6) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function AdminBookingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { bookings, trucks, users, setBookingStatus } = useIbanga();
  const { drivers, driverAssignments, shipments } = useOps();
  const toast = useToast();

  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? ""])) as Record<FilterKey, string>;
  const activeCount = FILTER_KEYS.filter((key) => filters[key]).length;

  function setFilters(next: Partial<Record<FilterKey, string>>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const truckById = useMemo(() => new Map(trucks.map((truck) => [truck.id, truck])), [trucks]);

  const filtered = useMemo(() => bookings.filter((booking) => {
    const pickup = booking.pickupDate.slice(0, 10);
    return (!filters.from || canonicalPlace(booking.pickupLocation) === filters.from)
      && (!filters.to || canonicalPlace(booking.destination) === filters.to)
      && (!filters.status || filters.status.split(",").includes(booking.status))
      && (!filters.cargo || booking.cargoType === filters.cargo)
      && (!filters.truckType || truckById.get(booking.truckId)?.truckType === filters.truckType)
      && (!filters.method || booking.payment?.method === filters.method)
      && (!filters.paid || (filters.paid === "UNPAID" ? !booking.payment || booking.payment.status === "PENDING"
        : filters.paid === "HELD" ? ["HELD", "FUNDED", "AUTHORIZED"].includes(booking.payment?.status ?? "")
          : booking.payment?.status === filters.paid))
      && (!filters.start || pickup >= filters.start)
      && (!filters.end || pickup <= filters.end);
  }), [bookings, filters.cargo, filters.end, filters.from, filters.method, filters.paid, filters.start, filters.status, filters.to, filters.truckType, truckById]);

  // Places and cargo typed before the dropdowns existed still appear as choices.
  const fromOptions = [...new Set([...LOCATIONS, ...bookings.map((booking) => canonicalPlace(booking.pickupLocation))])];
  const toOptions = [...new Set([...LOCATIONS, ...bookings.map((booking) => canonicalPlace(booking.destination))])];
  const cargoOptions = [...new Set([...CARGO_TYPES, ...bookings.map((booking) => booking.cargoType)])];

  const paid = filtered.filter((booking) => booking.payment && booking.payment.status !== "PENDING");
  const totalValue = filtered.reduce((sum, booking) => sum + bookingValue(booking), 0);
  const priced = filtered.filter((booking) => bookingValue(booking) > 0);
  const commission = paid.reduce((sum, booking) => sum + (booking.payment?.commissionRwf ?? 0), 0);
  const count = (statuses: BookingStatus[]) => filtered.filter((booking) => statuses.includes(booking.status)).length;
  const finished = count(["DELIVERED", "COMPLETED"]);
  const decided = filtered.length - count(["PENDING"]);
  const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");
  const topRoutes = tally(filtered, routeOf);
  const topCargo = tally(filtered, (booking) => booking.cargoType);
  const routeLabel = filters.from || filters.to ? `${filters.from || "Anywhere"} — ${filters.to || "Anywhere"}` : "all routes";

  async function updateStatus(id: string, status: BookingStatus) {
    const error = await setBookingStatus(id, status);
    if (error) toast(error, "bad");
    else toast("Booking status updated.", "good");
  }

  return (
    <AdminPage permission="bookings">
      <>
        <PageHeader
          eyebrow="Marketplace"
          title="Bookings"
          subtitle="Every freight request across the marketplace. Filter by route, cargo, truck or payment to see the numbers behind it."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2.5" />
              <path d="M3 9.5h18M8 3v4m8-4v4" />
            </svg>
          }
        />

        <section aria-label="Booking filters" className="mt-6 rounded-2xl border border-line bg-card p-4 shadow-soft sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-navy">Filters</h2>
            {activeCount ? (
              <button type="button" onClick={() => setFilters(Object.fromEntries(FILTER_KEYS.map((key) => [key, ""])))} className="text-sm font-semibold text-brand hover:text-brand-dark">
                Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
              </button>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm font-medium text-navy">
              From
              <select className={`${selectClass} mt-1`} value={filters.from} onChange={(event) => setFilters({ from: event.target.value })}>
                <option value="">Any pickup place</option>
                {fromOptions.map((place) => <option key={place} value={place}>{place}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy">
              To
              <select className={`${selectClass} mt-1`} value={filters.to} onChange={(event) => setFilters({ to: event.target.value })}>
                <option value="">Any destination</option>
                {toOptions.map((place) => <option key={place} value={place}>{place}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy">
              Booking status
              <select className={`${selectClass} mt-1`} value={filters.status} onChange={(event) => setFilters({ status: event.target.value })}>
                <option value="">All statuses</option>
                {filters.status.includes(",") ? <option value={filters.status}>{filters.status.replaceAll("_", " ").replaceAll(",", ", ")}</option> : null}
                {STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy">
              Cargo type
              <select className={`${selectClass} mt-1`} value={filters.cargo} onChange={(event) => setFilters({ cargo: event.target.value })}>
                <option value="">All cargo</option>
                {cargoOptions.map((cargo) => <option key={cargo} value={cargo}>{cargo}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy">
              Truck type
              <select className={`${selectClass} mt-1`} value={filters.truckType} onChange={(event) => setFilters({ truckType: event.target.value })}>
                <option value="">All trucks</option>
                {TRUCK_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy">
              Payment
              <select className={`${selectClass} mt-1`} value={filters.paid} onChange={(event) => setFilters({ paid: event.target.value })}>
                <option value="">Any payment state</option>
                {PAYMENT_STATES.map((state) => <option key={state.value} value={state.value}>{state.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy">
              Paid with
              <select className={`${selectClass} mt-1`} value={filters.method} onChange={(event) => setFilters({ method: event.target.value })}>
                <option value="">Any method</option>
                {PAYMENT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm font-medium text-navy">
                Pickup from
                <input type="date" className={`${selectClass} mt-1`} value={filters.start} max={filters.end || undefined} onChange={(event) => setFilters({ start: event.target.value })} />
              </label>
              <label className="block text-sm font-medium text-navy">
                Pickup to
                <input type="date" className={`${selectClass} mt-1`} value={filters.end} min={filters.start || undefined} onChange={(event) => setFilters({ end: event.target.value })} />
              </label>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted" aria-live="polite">
            Showing <span className="font-semibold text-navy">{filtered.length}</span> of {bookings.length} bookings on {routeLabel}.
          </p>
        </section>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Bookings" value={filtered.length} hint={`${count(["PENDING"])} waiting on owners`} />
          <StatCard label="Value booked" value={formatRwf(totalValue)} hint={`Average ${formatRwf(priced.length ? totalValue / priced.length : 0)} per trip`} accent="good" />
          <StatCard label="Platform commission" value={formatRwf(commission)} hint={`From ${paid.length} paid booking${paid.length === 1 ? "" : "s"}`} accent="accent" />
          <StatCard label="Delivered" value={percent(finished, decided)} hint={`${finished} of ${decided} decided bookings`} accent="good" />
          <StatCard label="On the road" value={count(["ACCEPTED", "IN_PROGRESS"])} hint="Accepted or moving" accent="accent" />
          <StatCard label="Disputed" value={count(["DISPUTED"])} hint={`${percent(count(["DISPUTED"]), filtered.length)} of bookings`} accent="bad" />
          <StatCard label="Rejected" value={count(["REJECTED"])} hint={`${percent(count(["REJECTED"]), filtered.length)} of bookings`} accent="warn" />
          <StatCard label="Trucks used" value={new Set(filtered.map((booking) => booking.truckId)).size} hint={`${new Set(filtered.map((booking) => booking.importerId)).size} importers`} />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <LineChartCard
            title="Bookings per month"
            caption={`New bookings on ${routeLabel}`}
            badge="Last 6 months"
            points={bucketByMonth(filtered, (booking) => booking.createdAt)}
            unit="bookings"
          />
          <BarChartCard
            title="Value per month"
            caption="Paid or agreed amount, by booking month"
            badge={`Total ${formatRwf(totalValue)}`}
            points={bucketByMonth(filtered, (booking) => booking.createdAt, bookingValue)}
            format={formatRwf}
            empty="No priced bookings in the last six months."
          />
          <section className="min-w-0 rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
            <h3 className="text-lg font-semibold text-navy">Busiest routes</h3>
            <p className="mt-1 text-sm text-muted">Click a route to filter by it.</p>
            {topRoutes.length ? (
              <ul className="mt-4 space-y-3">
                {topRoutes.map(([route, total]) => {
                  const [from, to] = route.split(" — ");
                  const value = filtered.filter((booking) => routeOf(booking) === route).reduce((sum, booking) => sum + bookingValue(booking), 0);
                  return (
                    <li key={route}>
                      <button type="button" onClick={() => setFilters({ from, to })} className="w-full text-left">
                        <span className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-navy hover:text-brand">{route}</span>
                          <span className="tabular-nums text-muted">{total} · {formatRwf(value)}</span>
                        </span>
                        <span className="block h-2 overflow-hidden rounded-full bg-line">
                          <span className="block h-full rounded-full bg-brand" style={{ width: `${(total / topRoutes[0][1]) * 100}%` }} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="mt-4 text-sm text-muted">No bookings match these filters.</p>}
          </section>
          <DonutCard
            title="Bookings by status"
            caption="Where the matching bookings stand today"
            centerLabel="bookings"
            slices={STATUS_SLICES.map((slice) => ({ label: slice.label, color: slice.color, count: count([slice.status]) }))}
            empty="No bookings match these filters."
          />
          <StatusBars
            title="Top cargo"
            caption="What is moving on these bookings"
            items={topCargo.map(([cargo, total]) => ({ label: cargo, value: total, tone: "accent" }))}
          />
          <StatusBars
            title="Payment methods"
            caption="How the paid bookings were paid"
            items={PAYMENT_METHODS.map((method) => ({ label: method.label, value: paid.filter((booking) => booking.payment?.method === method.value).length, tone: "good" }))}
          />
        </div>

        <div className="mt-5">
          <DataTable
            exportName="ibanga-bookings"
            columns={[{ label: "Route" }, { label: "Importer" }, { label: "Truck" }, { label: "Associated driver" }, { label: "Pickup" }, { label: "Cargo" }, { label: "Value" }, { label: "Status" }, { label: "Manage", className: "text-right" }]}
            emptyMessage="No bookings match these filters."
            rows={filtered.map((booking) => {
              const truck = truckById.get(booking.truckId);
              const importer = users.find((item) => item.id === booking.importerId);
              const assignment = driverAssignments.find((item) => item.bookingId === booking.id && item.status === "ACTIVE") ?? driverAssignments.find((item) => item.bookingId === booking.id && item.status === "UPCOMING");
              const shipment = shipments.find((item) => item.bookingId === booking.id);
              const driver = drivers.find((item) => item.id === assignment?.driverId) ?? drivers.find((item) => item.id === shipment?.driverId) ?? drivers.find((item) => item.assignedTruckId === booking.truckId);
              const route = `${booking.pickupLocation} to ${booking.destination}`;
              const value = bookingValue(booking);
              return {
                id: booking.id,
                searchText: `${route} ${importer?.name ?? ""} ${truck?.plateNumber ?? ""} ${driver?.name ?? ""} ${booking.cargoType}`,
                exportValues: [route, importer?.name ?? "", truck?.plateNumber ?? "", driver?.name ?? "Unassigned", formatDate(booking.pickupDate), `${booking.cargoType} ${booking.cargoWeight}`, value ? String(value) : "", booking.status, ""],
                cells: [
                  <span key={`${booking.id}-route`} className="font-semibold">{route}</span>,
                  importer ? <PersonName key={`${booking.id}-importer`} name={importer.name} photo={importer.photo} detail={importer.company} /> : "—",
                  truck ? <Link key={`${booking.id}-truck`} href={`/dashboard/admin/trucks/${truck.id}`} className="font-semibold text-brand hover:text-brand-dark">{truck.plateNumber}</Link> : "—",
                  driver ? <Link key={`${booking.id}-driver`} href={`/dashboard/admin/drivers/${driver.id}`} className="font-semibold text-brand hover:text-brand-dark">{driver.name}</Link> : <span className="text-muted">Unassigned</span>,
                  formatDate(booking.pickupDate),
                  `${booking.cargoType} · ${booking.cargoWeight}`,
                  value ? <span key={`${booking.id}-value`} className="tabular-nums">{formatRwf(value)}</span> : <span className="text-muted">—</span>,
                  <span key={`${booking.id}-status`}><BookingBadge status={booking.status} /></span>,
                  <div key={`${booking.id}-manage`} className="flex items-center justify-end gap-2">
                    <select
                      aria-label={`Update booking status for ${booking.id}`}
                      className={`${inputClass} min-w-36 py-2`}
                      value={booking.status}
                      onChange={(event) => void updateStatus(booking.id, event.target.value as BookingStatus)}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                    <ViewLink href={`/dashboard/admin/bookings/${booking.id}`} label={`View booking ${booking.id}`} />
                  </div>,
                ],
              };
            })}
          />
        </div>
      </>
    </AdminPage>
  );
}

export default function AdminBookingsPage() {
  // useSearchParams needs a Suspense boundary so the page can be prerendered.
  return (
    <Suspense fallback={<LoadingBlock />}>
      <AdminBookingsContent />
    </Suspense>
  );
}
