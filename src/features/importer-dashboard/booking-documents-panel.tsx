"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/toast";
import { Icon } from "@/features/importer-dashboard/kit";
import { useIbanga } from "@/lib/store";
import {
  DOCUMENT_KIND_LABEL,
  openBookingDocument,
  REQUIRED_DOCUMENTS,
} from "@/lib/booking-stage";
import type { Booking, BookingDocumentKind, Role } from "@/lib/types";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the selected file."));
    };
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}

export function BookingDocumentsPanel({ booking, role }: { booking: Booking; role: Role }) {
  const { uploadBookingDocument, removeBookingDocument } = useIbanga();
  const toast = useToast();
  const [kind, setKind] = useState<BookingDocumentKind>("CARGO");
  const [busy, setBusy] = useState(false);
  const funded = booking.payment?.status === "FUNDED";
  const editable = role === "IMPORTER" && booking.status === "ACCEPTED" && funded;
  const documents = booking.documents ?? [];
  const missing = REQUIRED_DOCUMENTS.filter(
    (required) => !documents.some((document) => document.kind === required.kind),
  );

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.elements.namedItem("booking-document") as HTMLInputElement).files?.[0];
    if (!file) return toast("Choose a document to upload.", "bad");
    if (!ACCEPTED_TYPES.has(file.type)) return toast("Choose a PDF, JPG, PNG, or WebP file.", "bad");
    if (file.size > MAX_FILE_BYTES) return toast("Each document must be 5 MB or smaller.", "bad");

    setBusy(true);
    try {
      const error = await uploadBookingDocument(booking.id, {
        kind,
        name: file.name,
        dataUrl: await fileAsDataUrl(file),
      });
      if (error) {
        toast(error, "bad");
        return;
      }
      form.reset();
      toast("Document uploaded. The owner and assigned driver have been notified.", "good");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not read the selected file.", "bad");
    } finally {
      setBusy(false);
    }
  }

  async function open(documentId: string) {
    try {
      await openBookingDocument(booking.id, documentId);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not open the document.", "bad");
    }
  }

  async function remove(documentId: string) {
    setBusy(true);
    const error = await removeBookingDocument(booking.id, documentId);
    setBusy(false);
    toast(error ?? "Document removed.", error ? "bad" : "good");
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
      <div className="border-b border-line bg-background/60 px-5 py-4">
        <h2 className="font-display text-lg text-navy">Cargo documents</h2>
        <p className="mt-1 text-sm text-muted">
          The owner or driver can start the trip after the cargo and tax documents are uploaded.
        </p>
      </div>
      <div className="space-y-4 px-5 py-5">
        {documents.length ? (
          <ul className="space-y-2">
            {documents.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-background px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2 text-sm text-navy">
                  <Icon name="file" className="h-4 w-4 shrink-0 text-brand" />
                  <span className="min-w-0 truncate"><strong>{DOCUMENT_KIND_LABEL[document.kind]}:</strong> {document.name}</span>
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <button type="button" onClick={() => void open(document.id)} className="text-sm font-semibold text-brand hover:text-brand-dark">
                    Open
                  </button>
                  {editable ? (
                    <button type="button" disabled={busy} onClick={() => void remove(document.id)} className="text-sm font-semibold text-bad hover:underline disabled:opacity-50">
                      Remove
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No booking documents have been uploaded yet.</p>
        )}

        {missing.length ? (
          <p className="rounded-xl border border-warn/30 bg-warn-soft/60 px-3.5 py-3 text-sm text-warn">
            Still required: {missing.map((item) => item.label).join(" and ")}.
          </p>
        ) : null}

        {editable ? (
          <form onSubmit={upload} className="grid gap-3 sm:grid-cols-[minmax(9rem,0.65fr)_minmax(0,1.35fr)_auto] sm:items-end">
            <label className="block text-sm font-medium text-navy">
              Document type
              <select value={kind} onChange={(event) => setKind(event.target.value as BookingDocumentKind)} className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">
                {REQUIRED_DOCUMENTS.map((item) => <option key={item.kind} value={item.kind}>{item.label}</option>)}
                <option value="OTHER">Other supporting document</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-navy">
              Choose a file
              <input name="booking-document" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="mt-1.5 block min-h-11 w-full rounded-xl border border-line bg-white px-2 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1 file:font-semibold file:text-brand" />
              <span className="mt-1 block text-xs font-normal text-muted">PDF, JPG, PNG or WebP · up to 5 MB</span>
            </label>
            <button type="submit" disabled={busy} className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "Uploading…" : "Upload"}
            </button>
          </form>
        ) : role === "IMPORTER" && !funded && booking.status === "ACCEPTED" ? (
          <p className="text-sm text-muted">Pay the 50% deposit to upload documents for this trip.</p>
        ) : null}
      </div>
    </section>
  );
}
