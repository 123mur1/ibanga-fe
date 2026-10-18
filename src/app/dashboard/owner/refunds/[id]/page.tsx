"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { useToast } from "@/components/toast";
import { Avatar } from "@/components/photos";
import { PaymentBadge, RefundBadge } from "@/components/status-badge";
import { ConfirmDialog, Field, GhostButton, inputClass, PageHeader, PrimaryButton, formatDate, formatDateTime } from "@/components/ui";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";

export default function OwnerRefundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { refunds, bookings, trucks, users, currentUser, processRefund } = useIbanga();
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [busy, setBusy] = useState(false);

  const found = refunds.find((item) => item.id === id);
  const booking = found ? bookings.find((item) => item.id === found.bookingId) : undefined;
  const truck = booking ? trucks.find((item) => item.id === booking.truckId) : undefined;
  const refund = found && truck?.ownerId === currentUser?.id ? found : undefined;
  const importer = refund ? users.find((item) => item.id === refund.importerId) : undefined;
  const payment = booking?.payment;

  function ask(decision: "APPROVED" | "REJECTED") {
    if (decision === "REJECTED" && note.trim().length < 5) {
      setNoteError("Tell the importer why the request is rejected.");
      return;
    }
    setNoteError(null);
    setConfirming(decision);
  }

  async function decide() {
    if (!refund || !confirming) return;
    setBusy(true);
    const error = await processRefund(refund.id, confirming, note.trim());
    setBusy(false);
    setConfirming(null);
    if (error) toast(error, "bad");
    else toast(confirming === "APPROVED" ? "Refund approved. The money goes back to the importer." : "Refund request rejected.", "good");
  }

  return (
    <RequireAuth role="TRUCK_OWNER">
      <DashboardShell role="TRUCK_OWNER">
        <Link href="/dashboard/owner/refunds" className="group inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 group-hover:-translate-x-0.5 group-hover:bg-brand group-hover:text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 4-8 8 8 8" />
            </svg>
          </span>
          All refunds
        </Link>

        {!refund || !booking ? (
          <p className="mt-4 rounded-2xl border border-line bg-card px-5 py-10 text-center text-muted">This refund request could not be found.</p>
        ) : (
          <>
            <div className="mt-4">
              <PageHeader
                eyebrow="Refund request"
                title={`${booking.pickupLocation} to ${booking.destination}`}
                subtitle={`Requested ${formatDate(refund.createdAt)} · ${formatRwf(refund.amountRwf)}`}
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 3-6.7" />
                    <path d="M3 4v5h5" />
                    <path d="M12 8v4l2.5 1.5" />
                  </svg>
                }
                actions={<RefundBadge status={refund.status} />}
              />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)]">
              <div className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">What the importer says</h2>
                  </div>
                  <dl className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2">
                    <Item label="Reason" value={refund.reason} />
                    <Item label="Amount requested" value={formatRwf(refund.amountRwf)} />
                    <Item label="Refund to" value={refund.refundTo} />
                    <Item label="Requested on" value={formatDateTime(refund.createdAt)} />
                  </dl>
                  <div className="border-t border-line px-5 py-4">
                    <p className="text-sm font-medium text-muted">Details</p>
                    <p className="mt-1.5 leading-6 text-navy">{refund.details}</p>
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Booking and payment</h2>
                  </div>
                  <dl className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2">
                    <Item label="Cargo" value={`${booking.cargoType} · ${booking.cargoWeight}`} />
                    <Item label="Truck" value={truck ? `${truck.plateNumber} · ${truck.truckType}` : "—"} />
                    <Item label="Pickup date" value={formatDate(booking.pickupDate)} />
                    <Item label="Booking status" value={booking.status.replaceAll("_", " ")} />
                    {payment ? <Item label="Amount paid" value={formatRwf(payment.amountRwf)} /> : null}
                    {payment ? <Item label="Your share" value={formatRwf(payment.ownerAmountRwf)} /> : null}
                  </dl>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
                    {payment ? <PaymentBadge status={payment.status} /> : <span />}
                    <div className="flex gap-4 text-sm font-semibold">
                      <Link href={`/dashboard/owner/bookings/${booking.id}`} className="text-brand hover:text-brand-dark">View booking</Link>
                      {payment ? <Link href={`/dashboard/owner/payments/${booking.id}`} className="text-brand hover:text-brand-dark">View payment</Link> : null}
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-brand px-5 py-4 text-white">
                    <h2 className="font-display text-lg">Your decision</h2>
                    <p className="mt-1 text-sm text-white/80">
                      {refund.status === "REQUESTED" ? "Approve to return the money, or reject with a reason." : "This request has been processed."}
                    </p>
                  </div>
                  {refund.status === "REQUESTED" ? (
                    <div className="space-y-4 px-5 py-5">
                      <Field label="Note to the importer">
                        <textarea
                          className={`${inputClass} min-h-28 resize-y`}
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          placeholder="Optional when approving. Required when rejecting."
                        />
                      </Field>
                      {noteError ? <p role="alert" className="text-sm font-medium text-bad">{noteError}</p> : null}
                      <div className="flex flex-col gap-2">
                        <PrimaryButton type="button" onClick={() => ask("APPROVED")}>Approve refund</PrimaryButton>
                        <GhostButton type="button" className="hover:border-bad/30 hover:text-bad" onClick={() => ask("REJECTED")}>Reject request</GhostButton>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 px-5 py-5">
                      <RefundBadge status={refund.status} />
                      <p className="text-sm leading-6 text-navy">{refund.ownerNote || "No note was left."}</p>
                      {refund.resolvedAt ? <p className="text-xs font-medium text-muted">Processed {formatDateTime(refund.resolvedAt)}</p> : null}
                    </div>
                  )}
                </section>

                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Importer</h2>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-4">
                    <Avatar src={importer?.photo} name={importer?.name ?? "Unknown"} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">{importer?.name ?? "Unknown"}</p>
                      <p className="truncate text-xs text-muted">{[importer?.email, importer?.phone].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                </section>
              </aside>
            </div>

            {confirming ? (
              <ConfirmDialog
                title={confirming === "APPROVED" ? "Approve this refund?" : "Reject this request?"}
                message={
                  confirming === "APPROVED"
                    ? `${formatRwf(refund.amountRwf)} goes back to ${importer?.name ?? "the importer"}. ${booking.status === "ACCEPTED" ? "The booking is cancelled and your truck becomes available again." : "This cannot be undone."}`
                    : `${importer?.name ?? "The importer"} will see your note and the payment stays as it is.`
                }
                confirmLabel={confirming === "APPROVED" ? "Approve refund" : "Reject request"}
                tone={confirming === "APPROVED" ? "brand" : "danger"}
                busy={busy}
                onConfirm={() => void decide()}
                onCancel={() => !busy && setConfirming(null)}
              />
            ) : null}
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
