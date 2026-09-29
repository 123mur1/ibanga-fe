"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { EmptyState, PageHeader, Field, inputClass, PrimaryButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function AdminDisputesPage() {
  const { disputes, bookings, users, trucks, resolveDispute } = useIbanga();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const open = disputes.filter((d) => d.status === "OPEN");

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <PageHeader
          eyebrow="Fairness"
          title="Disputes"
          subtitle="Resolve the review, then the importer must confirm receipt before funds are released and the truck becomes available."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3 2.5 20h19L12 3Z" />
              <path d="M12 9.5V14M12 17.5h.01" />
            </svg>
          }
        />
        <p className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-bad-soft text-bad">
          <span className="h-1.5 w-1.5 rounded-full bg-bad" />
          {open.length} open, {disputes.length - open.length} resolved
        </p>

        <div className="mt-4 space-y-4">
          {disputes.length ? (
            disputes.map((dispute) => {
              const booking = bookings.find((b) => b.id === dispute.bookingId);
              const importer = users.find((u) => u.id === dispute.raisedBy);
              const truck = booking
                ? trucks.find((t) => t.id === booking.truckId)
                : undefined;
              const isOpen = dispute.status === "OPEN";
              return (
                <article
                  key={dispute.id}
                  className={`overflow-hidden rounded-2xl border bg-card shadow-soft transition ${
                    isOpen ? "border-bad/25" : "border-line opacity-80"
                  }`}
                >
                  <div
                    className={`border-b border-line px-5 py-4 ${
                      isOpen ? "bg-gradient-to-r from-bad-soft/60 to-transparent" : "bg-background/60"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-display text-lg tracking-tight text-navy">
                        {booking
                          ? `${booking.pickupLocation} → ${booking.destination}`
                          : dispute.bookingId}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          isOpen
                            ? "bg-white text-bad ring-bad/20"
                            : "bg-good-soft text-good ring-good/10"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isOpen ? "bg-bad" : "bg-good"
                          }`}
                        />
                        {dispute.status}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted">
                      Raised by {importer?.name} · truck {truck?.plateNumber}
                    </p>
                  </div>
                  <div className="px-5 py-4">
                    <p className="rounded-xl bg-background px-3.5 py-2.5 text-sm text-navy">
                      “{dispute.reason}”
                    </p>
                    {isOpen ? (
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
                      <p className="mt-3 flex items-start gap-2 text-sm text-muted">
                        <svg className="mt-0.5 shrink-0 text-good" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
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
              text="Importer problem reports will appear here for you to resolve."
            />
          )}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}