"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PublicPage } from "@/components/public-page";

type Faq = { topic: string; question: string; answer: string };

const FAQS: Faq[] = [
  { topic: "Getting started", question: "How do I create an account?", answer: "Choose Register, pick whether you are an importer or a truck owner, and complete your details. You can browse available trucks without an account; you only need one when you start a booking." },
  { topic: "Getting started", question: "Why do I need to verify my account?", answer: "Verification protects both sides. Importers confirm their identity and company. Truck owners confirm their company, trucks, drivers and insurance. Unverified or expired documents can stop a truck or driver from taking new work." },
  { topic: "Cargo requests & quotations", question: "What is the difference between a quotation and a booking?", answer: "A quotation is a price offer from a truck owner. It is not a commitment until you accept it. Accepting one quotation creates the booking and the others are closed." },
  { topic: "Cargo requests & quotations", question: "Can I edit a cargo request after publishing?", answer: "You can edit a draft or an open request that has no quotations yet. Once quotations exist, cancel the request and create a new one so everyone is quoting on the same details." },
  { topic: "Payments", question: "When is my payment taken and where does the money go?", answer: "You pay after a booking is confirmed. The money is held by iBanga while the shipment happens. It is released to the truck owner only after delivery is verified and no dispute or incident is holding the booking." },
  { topic: "Payments", question: "Which payment methods are supported?", answer: "Visa card, MTN MoMo and Airtel Money." },
  { topic: "Shipments & delivery", question: "How do I track my shipment?", answer: "Open Shipments & tracking. You will see milestones such as pickup, loading and departure, delay notices and the estimated arrival. Live GPS tracking is planned but not part of this build." },
  { topic: "Shipments & delivery", question: "What is the difference between submitted and verified delivery?", answer: "The driver submits proof of delivery (photos, recipient and a code). An administrator then verifies it. Only verified delivery makes the settlement eligible." },
  { topic: "Cancellations & refunds", question: "Will I get a full refund if I cancel?", answer: "It depends on how far the booking got. Before payment there is no fee. After payment and before pickup a cancellation fee applies, and after pickup the fee is higher. The fee and refund are shown before you confirm." },
  { topic: "Cancellations & refunds", question: "How long does a refund take?", answer: "An administrator reviews each request. Approved refunds are then returned to the original payment method. Failed refunds are flagged and retried." },
  { topic: "Disputes & support", question: "How do I report a problem with a delivery?", answer: "Open a dispute from the booking or shipment, choose a category, describe what happened and attach evidence. The settlement is held until an administrator resolves the case." },
  { topic: "Disputes & support", question: "How do I contact support?", answer: "Create a support ticket from your dashboard or use the Contact page. You can follow the conversation and replies in your ticket." },
  { topic: "Truck owners", question: "Why can't I assign my driver or truck?", answer: "A truck or driver cannot be assigned if a required document is missing, rejected or expired, if the driver is suspended, or if the dates clash with another assignment. The page tells you exactly what to fix." },
  { topic: "Truck owners", question: "When do I get paid?", answer: "After delivery verification and when no dispute or incident is open, your settlement becomes eligible. An administrator approves it, the platform fee is deducted and the payout starts." },
];

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(FAQS[0].question);
  const topics = useMemo(() => [...new Set(FAQS.map((item) => item.topic))], []);
  const needle = query.trim().toLowerCase();
  const filtered = FAQS.filter((item) => !needle || `${item.question} ${item.answer}`.toLowerCase().includes(needle));

  return (
    <PublicPage eyebrow="Help centre" title="How can we help?" intro="Answers to common questions about cargo requests, payments, shipments, refunds and disputes." width="max-w-4xl">
      <div className="relative">
        <label htmlFor="help-search" className="sr-only">Search help articles</label>
        <input
          id="help-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for refunds, quotations, documents…"
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-white px-6 py-12 text-center">
          <p className="font-semibold text-navy">No articles match “{query}”.</p>
          <p className="mt-1 text-sm text-muted">Try different words, or ask our team directly.</p>
          <Link href="/contact" className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Contact support</Link>
        </div>
      ) : (
        topics
          .filter((topic) => filtered.some((item) => item.topic === topic))
          .map((topic) => (
            <section key={topic} className="mt-8">
              <h2 className="font-display text-lg text-navy">{topic}</h2>
              <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
                {filtered
                  .filter((item) => item.topic === topic)
                  .map((item) => {
                    const expanded = open === item.question;
                    return (
                      <li key={item.question}>
                        <h3>
                          <button
                            type="button"
                            aria-expanded={expanded}
                            onClick={() => setOpen(expanded ? null : item.question)}
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-navy transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                          >
                            {item.question}
                            <svg className={`shrink-0 transition ${expanded ? "rotate-180" : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                          </button>
                        </h3>
                        {expanded ? <p className="px-5 pb-5 text-sm leading-7 text-muted">{item.answer}</p> : null}
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))
      )}

      <div className="mt-10 rounded-2xl bg-brand-soft/70 px-6 py-6">
        <h2 className="font-display text-lg text-navy">Still need help?</h2>
        <p className="mt-1 text-sm text-muted">Signed-in users can open a support ticket from their dashboard. Everyone can reach us from the contact page.</p>
        <Link href="/contact" className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Contact us</Link>
      </div>
    </PublicPage>
  );
}
