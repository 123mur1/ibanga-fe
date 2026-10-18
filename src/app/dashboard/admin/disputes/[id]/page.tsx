"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { useToast } from "@/components/toast";
import { DisputeBadge } from "@/components/status-badge";
import { Avatar } from "@/components/photos";
import { inputClass, PageHeader, PrimaryButton, formatDate, formatDateTime } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import { formatRwf } from "@/lib/payments";

export default function AdminDisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { disputes, bookings, trucks, users, resolveDispute } = useIbanga();
  const toast = useToast();
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const dispute = disputes.find((item) => item.id === id);
  const booking = dispute ? bookings.find((item) => item.id === dispute.bookingId) : undefined;
  const importer = booking ? users.find((item) => item.id === booking.importerId) : undefined;
  const truck = booking ? trucks.find((item) => item.id === booking.truckId) : undefined;
  const owner = truck?.owner ?? (truck ? users.find((item) => item.id === truck.ownerId) : undefined);

  async function resolve() {
    if (!dispute) return;
    setSaving(true);
    const error = await resolveDispute(dispute.id, notes.trim() || "Resolved by admin");
    setSaving(false);
    if (error) {
      toast(error, "bad");
      return;
    }
    toast("Dispute resolved and closed.", "good");
    setNotes("");
  }

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <Link href="/dashboard/admin/disputes" className="group inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 group-hover:-translate-x-0.5 group-hover:bg-brand group-hover:text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 4-8 8 8 8" />
            </svg>
          </span>
          All disputes
        </Link>

        {!dispute ? (
          <p className="mt-4 rounded-2xl border border-line bg-card px-5 py-10 text-center text-muted">
            This dispute could not be found.
          </p>
        ) : (
          <>
            <div className="mt-4">
              <PageHeader
                eyebrow="Dispute case"
                title={booking ? `${booking.pickupLocation} to ${booking.destination}` : dispute.bookingId}
                subtitle={`Filed ${formatDate(dispute.createdAt)} · Case ${dispute.id}`}
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3 2.5 20h19L12 3Z" />
                    <path d="M12 9.5V14M12 17.5h.01" />
                  </svg>
                }
                actions={
                  <DisputeBadge status={dispute.status} label={dispute.status === "OPEN" ? "Open case" : "Resolved"} />
                }
              />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)]">
              <div className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Reported issue</h2>
                  </div>
                  <p className="px-5 py-5 text-base leading-6 text-navy">{dispute.reason}</p>
                </section>

                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Booking under dispute</h2>
                  </div>
                  {booking ? (
                    <dl className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2">
                      <Item label="Booking ID" value={booking.id} />
                      <Item label="Cargo" value={`${booking.cargoType} · ${booking.cargoWeight}`} />
                      <Item label="Route" value={`${booking.pickupLocation} to ${booking.destination}`} />
                      <Item label="Truck" value={truck ? `${truck.plateNumber} · ${truck.truckType}` : "Not assigned"} />
                      <Item label="Agreed price" value={booking.agreedPriceRwf ? formatRwf(booking.agreedPriceRwf) : booking.agreedPrice || "—"} />
                      <Item label="Payment status" value={booking.payment?.status.replaceAll("_", " ") ?? "Not paid"} />
                    </dl>
                  ) : (
                    <p className="px-5 py-5 text-sm text-muted">Booking details are not available for this case.</p>
                  )}
                </section>

                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Parties involved</h2>
                  </div>
                  <div className="divide-y divide-line">
                    <PartyRow label="Raised by (importer)" name={importer?.name} detail={importer?.email} photo={importer?.photo} />
                    <PartyRow label="Truck owner" name={owner?.name} detail={owner?.email ?? undefined} photo={owner?.photo ?? undefined} />
                  </div>
                </section>
              </div>

              <aside className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-brand px-5 py-4 text-white">
                    <h2 className="font-display text-lg">Resolution</h2>
                    <p className="mt-1 text-sm text-white/80">
                      {dispute.status === "OPEN" ? "Record the decision and close this case." : "This case has been closed."}
                    </p>
                  </div>
                  {dispute.status === "OPEN" ? (
                    <div className="space-y-4 px-5 py-5">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-navy">Resolution notes</span>
                        <textarea
                          className={`${inputClass} min-h-32 resize-y`}
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder="Explain how the dispute was settled for both parties."
                        />
                      </label>
                      <PrimaryButton type="button" onClick={() => void resolve()} disabled={saving} className="min-h-12 w-full justify-between px-5">
                        <span>{saving ? "Resolving…" : "Resolve & close case"}</span>
                        {!saving ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m5 12.5 4.5 4.5L19 7.5" />
                          </svg>
                        ) : null}
                      </PrimaryButton>
                    </div>
                  ) : (
                    <div className="px-5 py-5">
                      <p className="text-sm leading-6 text-navy">{dispute.resolutionNotes || "Closed by admin."}</p>
                      {dispute.resolvedAt ? (
                        <p className="mt-3 text-xs font-medium text-muted">Resolved {formatDateTime(dispute.resolvedAt)}</p>
                      ) : null}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-line bg-brand-soft/60 p-5">
                  <h3 className="font-display text-lg text-navy">Case timeline</h3>
                  <ol className="mt-4 space-y-4">
                    <TimelineItem tone="bg-brand" title="Dispute raised" detail={formatDateTime(dispute.createdAt)} />
                    {dispute.status === "RESOLVED" && dispute.resolvedAt ? (
                      <TimelineItem tone="bg-brand-dark" title="Resolved by admin" detail={formatDateTime(dispute.resolvedAt)} />
                    ) : (
                      <TimelineItem tone="bg-brand/30" title="Awaiting admin review" detail="Open case" />
                    )}
                  </ol>
                </section>
              </aside>
            </div>
          </>
        )}
      </DashboardShell>
    </RequireAuth>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold text-navy">{value}</dd>
    </div>
  );
}

function PartyRow({ label, name, detail, photo }: { label: string; name?: string; detail?: string; photo?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Avatar src={photo} name={name ?? "Unknown"} size="sm" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="truncate font-semibold text-navy">{name ?? "Unknown"}</p>
        {detail ? <p className="truncate text-xs text-muted">{detail}</p> : null}
      </div>
    </div>
  );
}

function TimelineItem({ tone, title, detail }: { tone: string; title: string; detail: string }) {
  return (
    <li className="flex gap-3">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${tone}`} />
      <div>
        <p className="text-sm font-semibold text-navy">{title}</p>
        <p className="text-sm text-muted">{detail}</p>
      </div>
    </li>
  );
}
