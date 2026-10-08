"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLink } from "./brand";
import { dashboardPath, useIbanga } from "@/lib/store";

const steps = [
  {
    n: "01",
    title: "Owner lists a truck",
    text: "The truck stays available until someone books it.",
  },
  {
    n: "02",
    title: "Importer books it",
    text: "Cargo and journey details are sent. The truck becomes unavailable right away.",
  },
  {
    n: "03",
    title: "Pay the listed price",
    text: "The owner lists a fixed transport price in RWF. Pay from your iBanga wallet after acceptance.",
  },
  {
    n: "04",
    title: "Owner accepts or rejects",
    text: "Accept keeps the truck locked for the trip. Reject makes it available again.",
  },
  {
    n: "05",
    title: "Move the cargo",
    text: "Owner starts the trip and marks delivered.",
  },
  {
    n: "06",
    title: "Confirm or dispute",
    text: "Importer confirms receipt — or reports a problem. Only then can a locked truck be freed after a completed trip.",
  },
];

export function LandingPage() {
  const { currentUser } = useIbanga();
  const [menu, setMenu] = useState(false);
  const appHref = currentUser ? dashboardPath(currentUser.role) : "/login";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <BrandLink />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <a href="#how" className="transition hover:text-brand">
              How it works
            </a>
            <a href="#roles" className="transition hover:text-brand">
              Roles
            </a>
            <Link href="/trucks" className="transition hover:text-brand">
              Available trucks
            </Link>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {currentUser ? (
              <Link
                href={appHref}
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-700 transition hover:text-brand">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm md:hidden"
            onClick={() => setMenu((v) => !v)}
          >
            Menu
          </button>
        </div>
        {menu ? (
          <div className="space-y-2 border-t border-line bg-white px-4 py-4 md:hidden">
            <Link href="/trucks" className="block py-1.5 text-slate-700">
              Available trucks
            </Link>
            <Link href="/login" className="block py-1.5 text-slate-700">
              Log in
            </Link>
            <Link href="/register" className="block py-1.5 font-semibold text-brand">
              Get started
            </Link>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 -z-10 h-155 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.2),transparent_30%)]" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Direct cargo–truck marketplace
              </div>
              <h1 className="mt-6 max-w-xl font-display text-4xl leading-[0.96] text-navy sm:text-5xl lg:text-6xl">
                Move freight with clarity, speed, and trust.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
                iBanga connects cargo importers and truck owners in one clean
                marketplace. Search, book, pay, and confirm delivery without the
                friction of brokers or scattered WhatsApp deals.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/register?role=IMPORTER"
                  className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:-translate-y-0.5 hover:bg-brand-dark"
                >
                  I need a truck
                </Link>
                <Link
                  href="/register?role=TRUCK_OWNER"
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-navy shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
                >
                  I have trucks
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-good-soft text-good">✓</span>
                  Verified listings
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand">₦</span>
                  RWF pricing
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-amber-700">⚡</span>
                  Fast booking flow
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="float-slow absolute -left-4 top-8 h-28 w-28 rounded-full bg-brand/15 blur-2xl" />
              <div className="float-slow absolute -right-2 bottom-10 h-32 w-32 rounded-full bg-accent/15 blur-2xl [animation-delay:1s]" />
              <div className="absolute -inset-6 rounded-4xl bg-linear-to-br from-brand/12 via-transparent to-accent/18 blur-2xl" />
              <div className="relative overflow-hidden rounded-4xl border border-slate-200 bg-white p-3 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:p-4">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                  <span>Marketplace overview</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-good-soft px-2 py-1 text-[11px] font-semibold text-good">
                    <span className="h-1.5 w-1.5 rounded-full bg-good" />
                    Live
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/photos/ibanga-container-highway.png"
                    alt="Container truck on the highway"
                    className="h-36 w-full object-cover sm:h-44"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/photos/ibanga-container-yard.png"
                    alt="Container truck in the depot"
                    className="h-36 w-full object-cover sm:h-44"
                  />
                </div>

                <div className="mt-3 rounded-2xl bg-linear-to-br from-navy via-navy-soft to-brand p-5 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/65">Featured listing</p>
                      <p className="mt-2 font-display text-2xl">Container · 28 tons</p>
                    </div>
                    <span className="rounded-full bg-good px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      Available
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Route</p>
                      <p className="mt-1 font-medium">Kigali → Mombasa</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Price</p>
                      <p className="mt-1 font-display text-xl">RWF 1,350,000</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/photos/ibanga-owner-eric.png"
                        alt="Eric Ndayisaba"
                        className="h-11 w-11 rounded-full border-2 border-white/30 object-cover"
                      />
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Owner</p>
                        <p className="text-sm font-medium">Eric Ndayisaba</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Status</p>
                      <p className="text-sm font-medium">Ready today</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="float-slow rounded-2xl bg-brand-soft p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-brand">Loads</p>
                    <p className="mt-1 font-display text-2xl text-navy">120+</p>
                  </div>
                  <div className="float-slow rounded-2xl bg-accent-soft p-3 [animation-delay:0.9s]">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-amber-700">Trucks</p>
                    <p className="mt-1 font-display text-2xl text-navy">90</p>
                  </div>
                  <div className="float-slow rounded-2xl bg-good-soft p-3 [animation-delay:1.4s]">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-good">Success</p>
                    <p className="mt-1 font-display text-2xl text-navy">96%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Simple pricing</p>
              <h2 className="mt-2 font-display text-3xl text-navy sm:text-4xl">Built to make every move feel easy</h2>
            </div>
            <p className="max-w-xl text-muted">
              Transparent, direct pricing for importers and a clear path for owners to list and manage trucks.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="shine rounded-[28px] border border-brand/15 bg-linear-to-b from-brand to-brand-dark p-6 text-white shadow-[0_25px_60px_rgba(37,99,235,0.28)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Importer</p>
              <h3 className="mt-4 font-display text-3xl">Book direct</h3>
              <p className="mt-3 text-blue-100">Find trucks, compare routes, and secure the exact listed rate in one flow.</p>
              <ul className="mt-6 space-y-3 text-sm text-blue-50">
                <li>• Instant truck search</li>
                <li>• RWF pricing visibility</li>
                <li>• Booking status tracking</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Owner</p>
              <h3 className="mt-4 font-display text-3xl text-navy">List & manage</h3>
              <p className="mt-3 text-muted">Keep availability up to date and accept or reject each booking without friction.</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                <li>• Live availability updates</li>
                <li>• One-click trip actions</li>
                <li>• Clear dispute handling</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_25px_60px_rgba(15,23,42,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Admin</p>
              <h3 className="mt-4 font-display text-3xl">Oversight</h3>
              <p className="mt-3 text-slate-300">Stay in control of bookings, disputes, and account health across the marketplace.</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                <li>• Centralized dashboard</li>
                <li>• Dispute resolution tools</li>
                <li>• Safer operational visibility</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-16 text-white">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">Why teams switch</p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl">The direct path beats broker chaos</h2>
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                built for real logistics flow
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                <h3 className="font-display text-2xl text-white">Traditional process</h3>
                <ul className="mt-6 space-y-4 text-sm text-slate-300">
                  <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-400" />Multiple calls, manual messages, and unclear truck availability.</li>
                  <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-400" />Pricing is often negotiated off-platform and not tracked properly.</li>
                  <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-400" />Status updates are fragmented and delayed.</li>
                </ul>
              </div>

              <div className="rounded-[28px] border border-brand/30 bg-linear-to-br from-brand/20 via-blue-500/10 to-white/5 p-6">
                <h3 className="font-display text-2xl text-white">iBanga experience</h3>
                <ul className="mt-6 space-y-4 text-sm text-blue-50">
                  <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />One clean booking flow with live truck availability.</li>
                  <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />Direct RWF pricing visibility before anyone commits.</li>
                  <li className="flex items-start gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />Trip status, confirmations, and dispute tracking in one place.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">What partners say</p>
            <h2 className="mt-2 font-display text-3xl text-navy sm:text-4xl">Trusted by teams moving cargo every day</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {[
              {
                quote: "We needed a faster way to find available trucks without chasing calls all day. iBanga made the whole flow feel clearer and more reliable.",
                name: "Aline Uwamahoro",
                role: "Importer, Kigali",
              },
              {
                quote: "The process was simple enough for my team to keep listings updated, and the booking status gave us much more control over scheduling.",
                name: "Eric Ndayisaba",
                role: "Truck owner, Rusizi",
              },
              {
                quote: "The dashboard keeps everyone aligned. It reduces confusion between booking requests, confirmations, and exceptions — which matters in cargo logistics.",
                name: "Moses Kamanzi",
                role: "Operations lead",
              },
            ].map((item) => (
              <div key={item.name} className="rounded-[28px] border border-line bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <div className="mb-5 flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx}>★</span>
                  ))}
                </div>
                <p className="text-base leading-7 text-slate-700">“{item.quote}”</p>
                <div className="mt-6 border-t border-line pt-4">
                  <p className="font-semibold text-navy">{item.name}</p>
                  <p className="text-sm text-muted">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="border-y border-line bg-card/70">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">How it works</p>
                <h2 className="mt-2 font-display text-3xl text-navy sm:text-4xl">Built to simplify cargo movement</h2>
              </div>
              <p className="max-w-xl text-muted">
                One clear path from listing to confirmed delivery without brokers,
                middlemen, or messy manual coordination.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.n}
                  className="rounded-3xl border border-line bg-linear-to-br from-white to-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-sm text-brand">{step.n}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                      →
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl text-navy">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Who it’s for</p>
            <h2 className="mt-2 font-display text-3xl text-navy sm:text-4xl">One platform for every part of the chain</h2>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <RoleCard
              title="Importer"
              text="Search trucks, compare routes, book a journey, pay in-app, and confirm delivery once cargo arrives."
              href="/register?role=IMPORTER"
              cta="Register as importer"
            />
            <RoleCard
              title="Truck owner"
              text="List your vehicles, keep availability fresh, accept or reject requests, and manage trips from one place."
              href="/register?role=TRUCK_OWNER"
              cta="Register as owner"
            />
            <RoleCard
              title="Admin"
              text="Track activity, oversee listings and bookings, and resolve disputes that affect truck availability and delivery flow."
              href="/login"
              cta="Admin sign-in"
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl text-navy">Fleet types</h2>
            <span className="text-sm text-muted">Different trucks for different loads</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["/photos/ibanga-flatbed.png", "Flatbed"],
              ["/photos/ibanga-reefer.png", "Refrigerated"],
              ["/photos/ibanga-tanker.png", "Tanker"],
              ["/photos/ibanga-semi.png", "Semi-trailer"],
            ].map(([src, label]) => (
              <figure key={label} className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={label} className="h-32 w-full object-cover sm:h-36" />
                <figcaption className="px-3 py-3 text-sm font-medium text-slate-700">{label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="shine rounded-4xl bg-linear-to-r from-navy via-navy-soft to-brand px-6 py-10 text-white shadow-[0_30px_80px_rgba(37,99,235,0.22)] sm:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">Ready when you are</p>
                <h2 className="mt-3 font-display text-3xl sm:text-4xl">Find the right truck for the next move.</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/trucks"
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-navy transition hover:bg-slate-100"
                >
                  Browse trucks
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}

function RoleCard({
  title,
  text,
  href,
  cta,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-card p-6">
      <h3 className="font-display text-2xl text-navy">{title}</h3>
      <p className="mt-3 flex-1 text-sm text-muted">{text}</p>
      <Link
        href={href}
        className="mt-6 text-sm font-semibold text-brand hover:text-brand-dark"
      >
        {cta} →
      </Link>
    </div>
  );
}
