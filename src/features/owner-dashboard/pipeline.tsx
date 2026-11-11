"use client";

import Link from "next/link";
import { formatDate } from "@/components/ui";
import { EmptyNote, Icon, Panel, PanelLink, RouteLine, StageProgress, useTicker } from "@/features/importer-dashboard/kit";
import { bookingStage, depositDeadline, formatCountdown, missingDocuments, type BookingStage } from "@/lib/booking-stage";
import type { Booking, Truck } from "@/lib/types";

const COLUMNS: { title: string; hint: string; stages: BookingStage[]; tone: string }[] = [
  { title: "Waiting for deposit", hint: "Accepted; the importer pays 50% within the hour.", stages: ["DEPOSIT_DUE"], tone: "border-t-warn" },
  { title: "Preparing", hint: "Deposit paid; cargo and tax documents next.", stages: ["DOCUMENTS_DUE", "READY_TO_START"], tone: "border-t-brand" },
  { title: "On the road", hint: "In transit, or delivered and awaiting the balance.", stages: ["ON_THE_ROAD", "BALANCE_DUE"], tone: "border-t-accent" },
];

function TripCard({ booking, truck }: { booking: Booking; truck?: Truck }) {
  const stage = bookingStage(booking);
  const deadline = depositDeadline(booking);
  const now = useTicker(1000, Boolean(deadline));
  const left = deadline ? formatCountdown(deadline, now) : null;
  const missing = missingDocuments(booking);
  const note =
    stage === "DEPOSIT_DUE"
      ? left
        ? `Deposit due · ${left} left`
        : "Deposit window closed"
      : stage === "DOCUMENTS_DUE"
        ? `Waiting for ${missing.map((item) => item.label.toLowerCase()).join(" and ")}`
        : stage === "READY_TO_START"
          ? "Ready: you or your driver can start the trip"
          : stage === "BALANCE_DUE"
            ? "Delivered · importer confirms and pays the balance"
            : `Due ${formatDate(booking.expectedDeliveryDate)}`;
  return (
    <Link
      href={`/dashboard/owner/bookings/${booking.id}`}
      className="block space-y-3 rounded-xl border border-line bg-card p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-navy">{truck?.plateNumber ?? "Truck"} · {booking.cargoType}</p>
        <p className="shrink-0 text-xs text-muted">{formatDate(booking.pickupDate)}</p>
      </div>
      <RouteLine booking={booking} compact />
      <p className={`flex items-center gap-1.5 text-xs font-semibold ${stage === "READY_TO_START" ? "text-good" : stage === "DEPOSIT_DUE" ? "text-warn" : "text-brand-dark"}`}>
        <Icon name={stage === "READY_TO_START" ? "check" : "clock"} className="h-3.5 w-3.5" />
        {note}
      </p>
      <StageProgress booking={booking} />
    </Link>
  );
}

/** Accepted work by stage, so the owner sees what is ready to roll and what is moving. */
export function TripPipeline({ bookings, trucks }: { bookings: Booking[]; trucks: Truck[] }) {
  const live = bookings.filter((booking) => ["ACCEPTED", "IN_PROGRESS", "DELIVERED"].includes(booking.status));
  return (
    <Panel title="Trips" subtitle="From accepted to delivered." action={<PanelLink href="/dashboard/tracking">Live map</PanelLink>}>
      {live.length === 0 ? (
        <EmptyNote title="No trips in progress" text="Accepted bookings move through these stages: deposit, documents, on the road, delivered." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {COLUMNS.map((column) => {
            const items = live
              .filter((booking) => column.stages.includes(bookingStage(booking)))
              .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate));
            return (
              <section key={column.title} className={`rounded-2xl border border-line border-t-4 bg-background/50 p-3 ${column.tone}`}>
                <div className="mb-3 px-1">
                  <h3 className="flex items-center justify-between text-sm font-semibold text-navy">
                    {column.title}
                    <span className="rounded-full bg-card px-2 py-0.5 text-xs text-muted ring-1 ring-line">{items.length}</span>
                  </h3>
                  <p className="text-xs text-muted">{column.hint}</p>
                </div>
                <div className="stagger space-y-2.5">
                  {items.length ? (
                    items.map((booking) => <TripCard key={booking.id} booking={booking} truck={trucks.find((truck) => truck.id === booking.truckId)} />)
                  ) : (
                    <p className="px-1 py-4 text-center text-xs text-muted">Nothing here.</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
