"use client";

import { useState } from "react";
import { Modal, PrimaryButton, GhostButton, inputClass } from "@/components/ui";
import { Icon } from "@/features/importer-dashboard/kit";
import { useIbanga } from "@/lib/store";
import type { Booking } from "@/lib/types";

const QUICK = [
  { label: "Reached pickup", message: "I have reached the pickup location." },
  { label: "Cargo loaded", message: "The cargo is loaded and secured." },
  { label: "Departing pickup", message: "We are leaving the pickup location and starting the trip." },
  { label: "En route to destination", message: "The truck is on the way to the destination." },
  { label: "Reached destination", message: "We have reached the destination and are preparing to unload." },
  { label: "Vehicle condition issue", message: "Vehicle condition issue: " },
];

/**
 * Message to everyone on the trip. The importer and the truck owner get it in the app and by
 * email. With a delay, the delivery date moves later and overlapping later bookings shift
 * automatically; their importers can request a full refund at any time before their trip starts.
 */
export function TripUpdateDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { sendTripUpdate } = useIbanga();
  const [message, setMessage] = useState("");
  const [delayed, setDelayed] = useState(false);
  const [days, setDays] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ affected: number; delayDays: number } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (message.trim().length < 3) return setError("Write a short message (at least 3 characters).");
    if (/^vehicle condition issue:\s*$/i.test(message.trim())) return setError("Describe the vehicle condition issue.");
    if (delayed && (!Number.isInteger(days) || days < 1 || days > 30)) return setError("A delay is 1 to 30 days.");
    setBusy(true);
    setError(null);
    try {
      const result = await sendTripUpdate(booking.id, { message: message.trim(), delayDays: delayed ? days : 0 });
      if (result.error) setError(result.error);
      else setSent({ affected: result.affected, delayDays: delayed ? days : 0 });
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Modal title="Update sent" onClose={onClose} footer={<PrimaryButton type="button" onClick={onClose}>Done</PrimaryButton>}>
        <div className="flex flex-col items-center py-4 text-center animate-pop-in">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-good-soft text-good">
            <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path className="animate-check-draw" d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <p className="mt-4 font-semibold text-navy">The importer, owner, and assigned drivers were notified in their dashboards.</p>
          <p className="mt-1 text-xs text-muted">Email delivery depends on the platform&apos;s email configuration.</p>
          {sent.delayDays ? (
            <p className="mt-2 max-w-sm text-sm text-muted">
              Delivery moved {sent.delayDays} day{sent.delayDays === 1 ? "" : "s"} later.{" "}
              {sent.affected
                ? `${sent.affected} later booking${sent.affected === 1 ? "" : "s"} shifted automatically. Those importers were notified and can request a full refund any time before their trip starts.`
                : "No later booking on this truck is affected."}
            </p>
          ) : null}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Send a trip update"
      description={`${booking.pickupLocation} → ${booking.destination}. The importer, owner, and assigned drivers receive a dashboard notification; email delivery depends on platform configuration.`}
      onClose={onClose}
      footer={
        <>
          <GhostButton type="button" onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <PrimaryButton type="submit" form="trip-update-form" disabled={busy}>
            <Icon name="send" className="h-4 w-4" />
            {busy ? "Sending…" : delayed ? `Send and report ${days}-day delay` : "Send update"}
          </PrimaryButton>
        </>
      }
    >
      <form id="trip-update-form" onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {QUICK.map((item) => (
            <button key={item.label} type="button" onClick={() => setMessage(item.message)} className="rounded-full border border-line bg-background px-3 py-1.5 text-xs font-medium text-navy transition hover:border-brand hover:text-brand">
              {item.label}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-navy">Message</span>
          <textarea className={`${inputClass} min-h-28 resize-y`} value={message} maxLength={1000} onChange={(event) => setMessage(event.target.value)} placeholder="Where you are, what is happening, when you expect to arrive." required />
        </label>
        <div className={`rounded-xl border p-4 transition ${delayed ? "border-warn/40 bg-warn-soft/60" : "border-line bg-background"}`}>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-warn" checked={delayed} onChange={(event) => setDelayed(event.target.checked)} />
            <span>
              <span className="block text-sm font-semibold text-navy">The delivery will be late</span>
              <span className="block text-xs text-muted">The expected delivery date moves later by the days you choose.</span>
            </span>
          </label>
          {delayed ? (
            <div className="mt-3 animate-fade-in space-y-2">
              <label className="flex items-center gap-3">
                <span className="text-sm font-medium text-navy">Delay</span>
                <input type="number" min={1} max={30} value={days} onChange={(event) => setDays(Number(event.target.value))} className={`${inputClass} w-24`} />
                <span className="text-sm text-muted">day{days === 1 ? "" : "s"}</span>
              </label>
              <p className="text-xs leading-5 text-warn">
                Any later booking that overlaps will be shifted automatically. Its importer will be notified and can request a full refund at any time before the trip starts.
              </p>
            </div>
          ) : null}
        </div>
        {error ? <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p> : null}
      </form>
    </Modal>
  );
}
