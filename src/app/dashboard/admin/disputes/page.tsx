"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, Field, inputClass, PrimaryButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function AdminDisputesPage() {
  const { disputes, bookings, users, trucks, resolveDispute } = useIbanga();
  const [notes, setNotes] = useState<Record<string, string>>({});

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight text-navy">Disputes</h1>
            <p className="mt-1.5 text-sm text-muted">
              Resolving a dispute completes the booking and makes the truck
              available again.
            </p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {disputes.length ? (
            disputes.map((dispute) => {
              const booking = bookings.find((b) => b.id === dispute.bookingId);
              const importer = users.find((u) => u.id === dispute.raisedBy);
              const truck = booking
                ? trucks.find((t) => t.id === booking.truckId)
                : undefined;
              const open = dispute.status === "OPEN";
              return (
                <article
                  key={dispute.id}
                  className={`overflow-hidden rounded-2xl border bg-card shadow-soft ${
                    open ? "border-bad/25" : "border-line"
                  }`}
                >
                  <div className={`border-b border-line px-5 py-4 ${open ? "bg-bad-soft/40" : ""}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-display text-xl tracking-tight text-navy">
                        {booking
                          ? `${booking.pickupLocation} → ${booking.destination}`
                          : dispute.bookingId}
                      </h2>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          open
                            ? "bg-white text-bad ring-bad/20"
                            : "bg-good-soft text-good ring-good/10"
                        }`}
                      >
                        {dispute.status}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted">
                      Raised by {importer?.name} · truck {truck?.plateNumber}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p>{dispute.reason}</p>
                    {open ? (
                      <div className="mt-4 space-y-3 border-t border-line pt-4">
                        <Field label="Resolution notes">
                          <textarea
                            className={`${inputClass} min-h-20`}
                            value={notes[dispute.id] ?? ""}
                            onChange={(e) =>
                              setNotes((n) => ({
                                ...n,
                                [dispute.id]: e.target.value,
                              }))
                            }
                          />
                        </Field>
                        <PrimaryButton
                          type="button"
                          onClick={async () =>
                            await resolveDispute(
                              dispute.id,
                              notes[dispute.id] || "Resolved by admin",
                            )
                          }
                        >
                          Resolve and free truck
                        </PrimaryButton>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted">
                        Notes: {dispute.resolutionNotes}
                      </p>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="No disputes"
              text="Importer problem reports will appear here."
            />
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
