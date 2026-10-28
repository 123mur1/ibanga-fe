"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { useToast } from "@/components/toast";
import { PaymentBadge } from "@/components/status-badge";
import { Field, GhostButton, inputClass, PageHeader, PrimaryButton, formatDate } from "@/components/ui";
import { canRequestRefund } from "@/lib/refunds";
import { formatRwf } from "@/lib/payments";
import { useIbanga } from "@/lib/store";
import { REFUND_REASONS } from "@/lib/types";

const methodLabel: Record<string, string> = { VISA: "Visa card", AIRTEL: "Airtel Money", MTN: "MTN MoMo" };

export default function RequestRefundPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { bookings, trucks, users, refunds, currentUser, requestRefund } = useIbanga();

  const booking = bookings.find((item) => item.id === id && item.importerId === currentUser?.id);
  const payment = booking?.payment;
  const truck = booking ? trucks.find((item) => item.id === booking.truckId) : undefined;
  const owner = truck ? truck.owner ?? users.find((item) => item.id === truck.ownerId) : undefined;
  const pending = refunds.some((item) => item.bookingId === id && item.status === "REQUESTED");
  const eligible = canRequestRefund(booking, refunds);

  const [reason, setReason] = useState<string>(REFUND_REASONS[0]);
  const [details, setDetails] = useState("");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState<"ORIGINAL" | "OTHER">("ORIGINAL");
  const [otherAccount, setOtherAccount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!booking || !payment) return;
    const amountRwf = amount.trim() ? Number(amount.replace(/[^\d]/g, "")) : payment.amountRwf;
    if (!(amountRwf > 0) || amountRwf > payment.amountRwf) {
      setError(`Enter an amount from 1 to ${formatRwf(payment.amountRwf)}.`);
      return;
    }
    if (details.trim().length < 10) {
      setError("Explain what happened in at least a sentence.");
      return;
    }
    if (destination === "OTHER" && otherAccount.replace(/\D/g, "").length < 9) {
      setError("Enter the mobile money number to refund to.");
      return;
    }
    setBusy(true);
    setError(null);
    const failure = await requestRefund(booking.id, {
      reason,
      details,
      amountRwf,
      refundTo: destination === "ORIGINAL"
        ? `${methodLabel[payment.method] ?? payment.method} · ${payment.accountMask}`
        : `Mobile money · ${otherAccount.trim()}`,
    });
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    toast("Refund request sent. An administrator will decide.", "good");
    router.push("/dashboard/importer/refunds");
  }

  return (
    <RequireAuth role="IMPORTER">
      <DashboardShell role="IMPORTER">
        <Link href={`/dashboard/importer/payments/${id}`} className="group inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 group-hover:-translate-x-0.5 group-hover:bg-brand group-hover:text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 4-8 8 8 8" />
            </svg>
          </span>
          Back to payment
        </Link>

        {!booking || !payment ? (
          <p className="mt-4 rounded-2xl border border-line bg-card px-5 py-10 text-center text-muted">This payment could not be found.</p>
        ) : (
          <>
            <div className="mt-4">
              <PageHeader
                eyebrow="Refund"
                title="Request a refund"
                subtitle="Tell us what went wrong. Your payment stays held while an administrator reviews the case and decides."
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 3-6.7" />
                    <path d="M3 4v5h5" />
                    <path d="M12 8v4l2.5 1.5" />
                  </svg>
                }
              />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)]">
              <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                <div className="border-b border-line bg-brand px-5 py-4 text-white">
                  <h2 className="font-display text-lg">Refund details</h2>
                  <p className="mt-1 text-sm text-white/80">Sent to the iBanga administrators. {owner?.name ?? "The truck owner"} can see it and give their side.</p>
                </div>
                {!eligible ? (
                  <p className="px-5 py-8 text-sm text-muted">
                    {pending
                      ? "A refund request for this booking is already waiting for an administrator's decision."
                      : booking.dispute?.status === "RESOLVED"
                        ? "The dispute on this booking has already been decided."
                        : booking.status === "COMPLETED"
                          ? "This trip is complete, so its payment has already been settled."
                          : "This payment can no longer be refunded because the money has already been released or returned."}
                  </p>
                ) : (
                  <form onSubmit={onSubmit} className="space-y-4 px-5 py-5">
                    <Field label="Reason">
                      <select className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)}>
                        {REFUND_REASONS.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </Field>
                    <Field label={`Amount to refund (max ${formatRwf(payment.amountRwf)})`}>
                      <input
                        className={inputClass}
                        inputMode="numeric"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder={String(payment.amountRwf)}
                      />
                    </Field>
                    <Field label="What happened?">
                      <textarea
                        className={`${inputClass} min-h-32 resize-y`}
                        required
                        minLength={10}
                        value={details}
                        onChange={(event) => setDetails(event.target.value)}
                        placeholder="Explain what went wrong. Mention dates, damage, or anything the administrator should check."
                      />
                    </Field>
                    <fieldset>
                      <legend className="text-sm font-medium text-navy">Refund the money to</legend>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {([
                          ["ORIGINAL", "Original payment method", `${methodLabel[payment.method] ?? payment.method} · ${payment.accountMask}`],
                          ["OTHER", "Another mobile money number", "Enter the number below"],
                        ] as const).map(([value, title, hint]) => (
                          <label
                            key={value}
                            className={`cursor-pointer rounded-xl border px-3.5 py-3 transition ${
                              destination === value ? "border-brand bg-brand-soft/70 ring-1 ring-brand/25" : "border-line bg-white hover:border-brand/40"
                            }`}
                          >
                            <input className="sr-only" type="radio" name="refund-to" checked={destination === value} onChange={() => setDestination(value)} />
                            <span className="block text-sm font-semibold text-navy">{title}</span>
                            <span className="mt-0.5 block text-xs text-muted">{hint}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    {destination === "OTHER" ? (
                      <Field label="Mobile money number">
                        <input className={inputClass} inputMode="numeric" value={otherAccount} onChange={(event) => setOtherAccount(event.target.value)} placeholder="078 000 0000" />
                      </Field>
                    ) : null}
                    {error ? <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm font-medium text-bad">{error}</p> : null}
                    <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
                      <GhostButton type="button" onClick={() => router.back()} disabled={busy}>Cancel</GhostButton>
                      <PrimaryButton type="submit" disabled={busy}>{busy ? "Sending…" : "Send refund request"}</PrimaryButton>
                    </div>
                  </form>
                )}
              </section>

              <aside className="space-y-5">
                <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                  <div className="flex items-center justify-between gap-3 border-b border-line bg-background/60 px-5 py-4">
                    <h2 className="font-display text-lg text-navy">Payment</h2>
                    <PaymentBadge status={payment.status} />
                  </div>
                  <dl className="divide-y divide-line text-sm">
                    <Row label="Receipt" value={payment.receiptNumber} />
                    <Row label="Route" value={`${booking.pickupLocation} to ${booking.destination}`} />
                    <Row label="Paid on" value={formatDate(payment.paidAt)} />
                    <Row label="Method" value={`${methodLabel[payment.method] ?? payment.method} · ${payment.accountMask}`} />
                    <Row label="Amount paid" value={formatRwf(payment.amountRwf)} strong />
                  </dl>
                </section>
                <section className="rounded-2xl border border-line bg-brand-soft/60 p-5 text-sm leading-6 text-navy">
                  <h3 className="font-display text-lg">How refunds work</h3>
                  <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-muted">
                    <li>You send this request. Your payment stays held, so the owner cannot be paid meanwhile.</li>
                    <li>The truck owner can give their side of the story.</li>
                    <li>An administrator decides: a full or partial refund, or no refund.</li>
                    <li>An approved refund goes straight to your iBanga wallet, from where you can withdraw it.</li>
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

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right tabular-nums ${strong ? "text-base font-semibold text-brand" : "font-semibold text-navy"}`}>{value}</dd>
    </div>
  );
}
