"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { useToast } from "@/components/toast";
import { Avatar } from "@/components/photos";
import { TripActions } from "@/components/trip-actions";
import { BookingBadge, DisputeBadge, PaymentBadge, TruckBadge } from "@/components/status-badge";
import { Field, GhostButton, inputClass, Modal, PageHeader, PrimaryButton, formatDate, formatDateTime } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import { formatRwf, maskAccount } from "@/lib/payments";
import type { Booking, BookingStatus, PaymentMethod, Role } from "@/lib/types";

const statuses: BookingStatus[] = ["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERED", "COMPLETED", "DISPUTED", "REJECTED"];

export function BookingDetail({
  role,
  backHref,
  backLabel,
}: {
  role: Role;
  backHref: string;
  backLabel: string;
}) {
  const { id } = useParams<{ id: string }>();
  const { bookings, trucks, users, currentUser } = useIbanga();

  const found = bookings.find((item) => item.id === id);
  const truck = found ? trucks.find((item) => item.id === found.truckId) : undefined;
  const importer = found ? users.find((item) => item.id === found.importerId) : undefined;
  const owner = truck?.owner ?? (truck ? users.find((item) => item.id === truck.ownerId) : undefined);
  const allowed = Boolean(
    found && currentUser && (
      role === "ADMIN"
      || (role === "IMPORTER" && found.importerId === currentUser.id)
      || (role === "TRUCK_OWNER" && truck?.ownerId === currentUser.id)
    ),
  );
  const booking = allowed ? found : undefined;
  const payment = booking?.payment;
  const dispute = booking?.dispute;

  return (
    <RequireAuth role={role}>
      <DashboardShell role={role}>
        <Link href={backHref} className="group inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 group-hover:-translate-x-0.5 group-hover:bg-brand group-hover:text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 4-8 8 8 8" />
            </svg>
          </span>
          {backLabel}
        </Link>

        {!booking ? (
          <p className="mt-4 rounded-2xl border border-line bg-card px-5 py-10 text-center text-muted">
            This booking could not be found.
          </p>
        ) : (
          <>
            <div className="mt-4">
              <PageHeader
                eyebrow="Booking detail"
                title={`${booking.pickupLocation} to ${booking.destination}`}
                subtitle={`${booking.cargoType} · ${booking.cargoWeight} · Created ${formatDate(booking.createdAt)}`}
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="2.5" />
                    <path d="M3 9.5h18M8 3v4m8-4v4" />
                  </svg>
                }
                actions={<BookingBadge status={booking.status} />}
              />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)]">
              <div className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Journey details</h2>
                  </div>
                  <dl className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2">
                    <Item label="Booking ID" value={booking.id} />
                    <Item label="Cargo" value={`${booking.cargoType} · ${booking.cargoWeight}`} />
                    <Item label="Pickup" value={`${booking.pickupLocation} · ${formatDate(booking.pickupDate)}`} />
                    <Item label="Destination" value={`${booking.destination} · ${formatDate(booking.expectedDeliveryDate)}`} />
                  </dl>
                  <div className="border-t border-line px-5 py-4">
                    <p className="text-sm font-medium text-muted">Description</p>
                    <p className="mt-1.5 text-navy">{booking.cargoDescription || "—"}</p>
                  </div>
                  {booking.additionalInstructions ? (
                    <div className="border-t border-line px-5 py-4">
                      <p className="text-sm font-medium text-muted">Instructions</p>
                      <p className="mt-1.5 text-sm text-muted">{booking.additionalInstructions}</p>
                    </div>
                  ) : null}
                </section>

                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Truck</h2>
                  </div>
                  {truck ? (
                    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
                      <div>
                        <p className="font-semibold text-navy">{truck.plateNumber} · {truck.truckType}</p>
                        <p className="mt-0.5 text-sm text-muted">{truck.capacity} tons · {truck.currentLocation}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <TruckBadge status={truck.status} />
                        {role === "IMPORTER" ? (
                          <Link href={`/trucks/${truck.id}`} className="text-sm font-semibold text-brand hover:text-brand-dark">
                            View truck profile
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <p className="px-5 py-5 text-sm text-muted">Truck details are not available.</p>
                  )}
                </section>

                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">{role === "ADMIN" ? "Parties involved" : role === "IMPORTER" ? "Truck owner" : "Importer"}</h2>
                  </div>
                  <div className="divide-y divide-line">
                    {role !== "TRUCK_OWNER" ? (
                      <PartyRow label="Truck owner" name={owner?.name} detail={owner ? [owner.email, owner.phone].filter(Boolean).join(" · ") : undefined} photo={owner?.photo ?? undefined} />
                    ) : null}
                    {role !== "IMPORTER" ? (
                      <PartyRow label="Importer" name={importer?.name} detail={importer ? [importer.email, importer.phone].filter(Boolean).join(" · ") : undefined} photo={importer?.photo ?? undefined} />
                    ) : null}
                  </div>
                </section>
              </div>

              <aside className="space-y-5">
                <ActionCard role={role} booking={booking} />

                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Price &amp; payment</h2>
                  </div>
                  <div className="px-5 py-5">
                    <p className="text-sm font-medium text-muted">Listed price</p>
                    <p className="mt-1 font-display text-2xl tabular-nums text-navy">
                      {booking.agreedPriceRwf == null ? "No price set" : formatRwf(booking.agreedPriceRwf)}
                    </p>
                    {payment ? (
                      <div className="mt-4 space-y-3 border-t border-line pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-muted">Payment</span>
                          <PaymentBadge status={payment.status} />
                        </div>
                        {role === "ADMIN" ? (
                          <>
                            <Row label="Commission (6%)" value={formatRwf(payment.commissionRwf)} />
                            <Row label="Owner share" value={formatRwf(payment.ownerAmountRwf)} />
                          </>
                        ) : role === "TRUCK_OWNER" ? (
                          <Row label="Your share" value={formatRwf(payment.ownerAmountRwf)} />
                        ) : (
                          <Row label="Total paid" value={formatRwf(payment.amountRwf)} />
                        )}
                        {role !== "TRUCK_OWNER" ? (
                          <Link
                            href={role === "ADMIN" ? `/dashboard/admin/payments/${booking.id}` : `/dashboard/importer/payments/${booking.id}`}
                            className="inline-block text-sm font-semibold text-brand hover:text-brand-dark"
                          >
                            View payment {payment.receiptNumber}
                          </Link>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted">No payment has been made yet.</p>
                    )}
                  </div>
                </section>

                {dispute ? (
                  <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                    <div className="flex items-center justify-between gap-3 border-b border-line bg-background/60 px-5 py-4">
                      <h2 className="font-display text-lg text-navy">Dispute</h2>
                      <DisputeBadge status={dispute.status} />
                    </div>
                    <div className="px-5 py-5">
                      <p className="text-sm leading-6 text-navy">{dispute.reason}</p>
                      {role === "ADMIN" ? (
                        <Link href={`/dashboard/admin/disputes/${dispute.id}`} className="mt-3 inline-block text-sm font-semibold text-brand hover:text-brand-dark">
                          Open dispute case
                        </Link>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-2xl border border-line bg-brand-soft/60 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg text-navy">Timeline</h3>
                    <Link href={`/dashboard/tracking/${booking.id}`} className="text-sm font-semibold text-brand hover:text-brand-dark">
                      Track cargo
                    </Link>
                  </div>
                  <ol className="mt-4 space-y-4">
                    <TimelineItem tone="bg-brand" title="Booking requested" detail={formatDateTime(booking.createdAt)} />
                    {payment ? <TimelineItem tone="bg-brand" title="Payment made" detail={formatDateTime(payment.paidAt)} /> : null}
                    {payment?.heldAt ? <TimelineItem tone="bg-brand/70" title="Funds held in escrow" detail={formatDateTime(payment.heldAt)} /> : null}
                    {payment?.releasedAt ? <TimelineItem tone="bg-navy" title="Funds released to owner" detail={formatDateTime(payment.releasedAt)} /> : null}
                    <TimelineItem tone="bg-brand-dark" title={`Current status: ${booking.status.replaceAll("_", " ").toLowerCase()}`} detail={`Pickup ${formatDate(booking.pickupDate)}`} />
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

function ActionCard({ role, booking }: { role: Role; booking: Booking }) {
  if (role === "ADMIN") return <AdminActions booking={booking} />;
  if (role === "TRUCK_OWNER") return <OwnerActions booking={booking} />;
  return <ImporterActions booking={booking} />;
}

function CardShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
      <div className="border-b border-line bg-brand px-5 py-4 text-white">
        <h2 className="font-display text-lg">{title}</h2>
        <p className="mt-1 text-sm text-white/80">{subtitle}</p>
      </div>
      <div className="space-y-4 px-5 py-5">{children}</div>
    </section>
  );
}

function AdminActions({ booking }: { booking: Booking }) {
  const { setBookingStatus } = useIbanga();
  const toast = useToast();

  async function updateStatus(status: BookingStatus) {
    const error = await setBookingStatus(booking.id, status);
    if (error) toast(error, "bad");
    else toast("Booking status updated.", "good");
  }

  return (
    <CardShell title="Manage booking" subtitle="Override the status when a trip needs intervention.">
      <Field label="Booking status">
        <select className={inputClass} value={booking.status} onChange={(event) => void updateStatus(event.target.value as BookingStatus)}>
          {statuses.map((status) => (
            <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
          ))}
        </select>
      </Field>
    </CardShell>
  );
}

function OwnerActions({ booking }: { booking: Booking }) {
  const hint =
    booking.status === "PENDING"
      ? "Accept the request to hold the truck, or decline to free it."
      : booking.status === "DELIVERED"
        ? "Waiting for the importer to confirm receipt."
        : booking.status === "DISPUTED"
          ? "The importer reported a problem. An admin will resolve it."
          : booking.status === "REJECTED"
            ? "You declined this request. The truck is available again."
            : booking.status === "COMPLETED"
              ? "This trip is complete."
              : "Move the trip forward as it progresses.";
  return (
    <CardShell title="Manage trip" subtitle={hint}>
      <TripActions booking={booking} />
    </CardShell>
  );
}

function ImporterActions({ booking }: { booking: Booking }) {
  const { setBookingStatus, reportProblem, payBooking, currentUser } = useIbanga();
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("MTN");
  const [account, setAccount] = useState("");
  const [payerName, setPayerName] = useState(currentUser?.name ?? "");
  const [payError, setPayError] = useState<string | null>(null);

  async function submitPayment() {
    const digits = account.replace(/\D/g, "");
    if (!payerName.trim()) return setPayError("Enter the name on the account.");
    if (method === "VISA" ? digits.length < 12 : digits.length < 9) {
      return setPayError(method === "VISA" ? "Enter the full card number." : "Enter a valid mobile money number.");
    }
    setPayError(null);
    setBusy(true);
    const error = await payBooking(booking.id, { method, payerName: payerName.trim(), accountMask: maskAccount(method, account) });
    setBusy(false);
    if (error) return setPayError(error);
    setPayOpen(false);
    toast("Payment is held. The owner can now start the trip.", "good");
  }

  async function run(task: () => Promise<string | null | undefined | void>, success: string) {
    if (busy) return;
    setBusy(true);
    const error = await task();
    setBusy(false);
    toast(error || success, error ? "bad" : "good");
  }

  const canPay = booking.status === "ACCEPTED" && !booking.payment;
  const canConfirm = booking.status === "DELIVERED" || (booking.status === "DISPUTED" && booking.dispute?.status === "RESOLVED");

  const subtitle =
    booking.status === "PENDING"
      ? "Waiting for the owner to accept your request."
      : canPay
        ? "The owner accepted. Pay before the trip begins."
        : canConfirm
          ? "Check the cargo, then confirm receipt or report a problem."
          : booking.status === "REJECTED"
            ? "The owner declined this request. The truck is available again."
            : booking.status === "COMPLETED"
              ? "This trip is complete."
              : "Nothing needs your attention right now.";

  return (
    <CardShell title="Your next step" subtitle={subtitle}>
      {canPay ? (
        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton type="button" disabled={!booking.agreedPriceRwf} onClick={() => setPayOpen(true)}>
            Pay {booking.agreedPriceRwf ? formatRwf(booking.agreedPriceRwf) : "now"}
          </PrimaryButton>
          <span className="text-xs text-muted">Held by iBanga until you confirm delivery.</span>
        </div>
      ) : null}

      {payOpen ? (
        <Modal
          title="Pay for this booking"
          description={`${booking.pickupLocation} to ${booking.destination} · ${booking.agreedPriceRwf ? formatRwf(booking.agreedPriceRwf) : ""}`}
          onClose={() => !busy && setPayOpen(false)}
          footer={
            <>
              <GhostButton type="button" disabled={busy} onClick={() => setPayOpen(false)}>Cancel</GhostButton>
              <PrimaryButton type="button" disabled={busy} onClick={() => void submitPayment()}>
                {busy ? "Processing…" : `Pay ${booking.agreedPriceRwf ? formatRwf(booking.agreedPriceRwf) : ""}`}
              </PrimaryButton>
            </>
          }
        >
          <div className="space-y-4">
            <fieldset>
              <legend className="text-sm font-medium text-navy">Payment method</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {([["MTN", "MTN MoMo"], ["AIRTEL", "Airtel Money"], ["VISA", "Visa card"]] as const).map(([value, label]) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-xl border px-3.5 py-3 text-center text-sm font-semibold transition ${
                      method === value ? "border-brand bg-brand-soft/70 text-brand-dark ring-1 ring-brand/25" : "border-line bg-white text-navy hover:border-brand/40"
                    }`}
                  >
                    <input className="sr-only" type="radio" name="pay-method" checked={method === value} onChange={() => setMethod(value)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label={method === "VISA" ? "Card number" : "Mobile money number"}>
              <input className={inputClass} inputMode="numeric" value={account} onChange={(event) => setAccount(event.target.value)} placeholder={method === "VISA" ? "4242 4242 4242 4242" : "078 000 0000"} autoComplete="off" />
            </Field>
            <Field label="Name on the account">
              <input className={inputClass} value={payerName} onChange={(event) => setPayerName(event.target.value)} autoComplete="off" />
            </Field>
            {payError ? <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm font-medium text-bad">{payError}</p> : null}
          </div>
        </Modal>
      ) : null}

      {canConfirm ? (
        <>
          <PrimaryButton type="button" disabled={busy} onClick={() => void run(() => setBookingStatus(booking.id, "COMPLETED"), "Receipt confirmed. Trip completed.")}>
            Confirm receipt
          </PrimaryButton>
          {booking.status === "DELIVERED" ? (
            <div className="space-y-3 border-t border-line pt-4">
              <Field label="Or report a problem">
                <textarea className={`${inputClass} min-h-20`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="What is wrong with the delivery?" />
              </Field>
              <GhostButton
                type="button"
                disabled={busy}
                className="hover:border-bad/30 hover:text-bad"
                onClick={() => {
                  if (!reason.trim()) {
                    toast("Please describe the problem.", "bad");
                    return;
                  }
                  void run(() => reportProblem(booking.id, reason.trim()), "Dispute opened. Admin will review.");
                }}
              >
                Report problem
              </GhostButton>
            </div>
          ) : null}
        </>
      ) : null}

      {!canPay && !canConfirm ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </CardShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-semibold tabular-nums text-navy">{value}</span>
    </div>
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
