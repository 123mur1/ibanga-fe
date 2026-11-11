"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { ConfirmDialog, formatDate } from "@/components/ui";
import { EmptyNote, Icon, Panel, PanelLink, RouteLine } from "@/features/importer-dashboard/kit";
import { dayCount, toDateKey } from "@/lib/availability";
import { DEPOSIT_WINDOW_MINUTES, depositAmount } from "@/lib/booking-stage";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";
import type { Booking, Truck, User } from "@/lib/types";

/** New requests with inline accept / decline. Pending requests never expire on their own. */
export function NewRequests({ bookings, trucks, users }: { bookings: Booking[]; trucks: Truck[]; users: User[] }) {
  const { setBookingStatus } = useIbanga();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [declining, setDeclining] = useState<Booking | null>(null);
  const requests = bookings
    .filter((booking) => booking.status === "PENDING")
    .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate));

  async function answer(booking: Booking, status: "ACCEPTED" | "REJECTED") {
    setBusy(booking.id);
    try {
      const error = await setBookingStatus(booking.id, status);
      if (error) toast(error, "bad");
      else
        toast(
          status === "ACCEPTED"
            ? `Accepted. The importer has ${DEPOSIT_WINDOW_MINUTES / 60} hour to pay the 50% deposit.`
            : "Request declined. The dates are free again.",
          "good",
        );
    } finally {
      setBusy(null);
      setDeclining(null);
    }
  }

  return (
    <Panel
      title="New requests"
      subtitle={
        requests.length
          ? `When you accept, the importer has ${DEPOSIT_WINDOW_MINUTES / 60} hour to pay 50%, or the booking is cancelled and the days freed.`
          : "Requests from importers appear here."
      }
      action={<PanelLink href="/dashboard/owner/bookings?status=PENDING">All requests</PanelLink>}
    >
      {requests.length === 0 ? (
        <EmptyNote title="No new requests" text="Your verified trucks are listed on the marketplace. Importers book the dates they need." />
      ) : (
        <ul className="stagger space-y-3">
          {requests.map((booking) => {
            const truck = trucks.find((item) => item.id === booking.truckId);
            const importer = users.find((user) => user.id === booking.importerId);
            const days = dayCount(toDateKey(new Date(booking.pickupDate)), toDateKey(new Date(booking.expectedDeliveryDate)));
            return (
              <li key={booking.id} className="rounded-2xl border border-warn/25 bg-gradient-to-br from-warn-soft/60 to-card p-4 transition duration-200 hover:shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-warn">New request · {truck?.plateNumber ?? "Truck"}</p>
                    <p className="mt-1 font-semibold text-navy">
                      {importer?.company || importer?.name || "An importer"} · {booking.cargoType}, {booking.cargoWeight} t
                    </p>
                    <p className="text-sm text-muted">
                      {formatDate(booking.pickupDate)} – {formatDate(booking.expectedDeliveryDate)} · {days} day{days === 1 ? "" : "s"}
                      {booking.distanceKm ? ` · ${booking.distanceKm.toLocaleString("en-RW")} km round trip` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold tabular-nums text-navy">{booking.agreedPriceRwf ? formatRwf(booking.agreedPriceRwf) : "—"}</p>
                    <p className="text-xs text-muted">Deposit {formatRwf(depositAmount(booking))} after you accept</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <RouteLine booking={booking} compact />
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/owner/bookings/${booking.id}`} className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-navy transition hover:border-brand hover:text-brand">
                      Details
                    </Link>
                    <button
                      type="button"
                      disabled={busy === booking.id}
                      onClick={() => setDeclining(booking)}
                      className="rounded-xl border border-bad/30 bg-white px-3 py-2 text-sm font-semibold text-bad transition hover:bg-bad-soft disabled:opacity-60"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      disabled={busy === booking.id}
                      onClick={() => void answer(booking, "ACCEPTED")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-good px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-good/90 disabled:opacity-60"
                    >
                      <Icon name="check" className="h-4 w-4" />
                      {busy === booking.id ? "Saving…" : "Accept"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {declining ? (
        <ConfirmDialog
          title="Decline this request?"
          message={`The importer is told you declined, and ${formatDate(declining.pickupDate)} – ${formatDate(declining.expectedDeliveryDate)} become free on your truck's calendar.`}
          confirmLabel="Decline request"
          tone="danger"
          busy={busy === declining.id}
          onConfirm={() => void answer(declining, "REJECTED")}
          onCancel={() => setDeclining(null)}
        />
      ) : null}
    </Panel>
  );
}
