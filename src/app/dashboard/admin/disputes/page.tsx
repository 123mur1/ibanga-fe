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
        <h1 className="font-display text-3xl text-navy">Disputes</h1>
        <p className="mt-1 text-muted">
          Resolving a dispute completes the booking and makes the truck
          available again.
        </p>
        <div className="mt-6 space-y-4">
          {disputes.length ? (
            disputes.map((dispute) => {
              const booking = bookings.find((b) => b.id === dispute.bookingId);
              const importer = users.find((u) => u.id === dispute.raisedBy);
              const truck = booking
                ? trucks.find((t) => t.id === booking.truckId)
                : undefined;
              return (
                <article
                  key={dispute.id}
                  className="rounded-2xl border border-line bg-card p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-xl text-navy">
                      {booking
                        ? `${booking.pickupLocation} → ${booking.destination}`
                        : dispute.bookingId}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        dispute.status === "OPEN"
                          ? "bg-bad-soft text-bad"
                          : "bg-good-soft text-good"
                      }`}
                    >
                      {dispute.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    Raised by {importer?.name} · truck {truck?.plateNumber}
                  </p>
                  <p className="mt-3">{dispute.reason}</p>
                  {dispute.status === "OPEN" ? (
                    <div className="mt-4 space-y-3">
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
                        onClick={() =>
                          resolveDispute(
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
