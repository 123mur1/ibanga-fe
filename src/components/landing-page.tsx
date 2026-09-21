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
    title: "Agree the price",
    text: "Importer and owner agree the transport fee. Payment stays off iBanga.",
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
    <div className="min-h-screen bg-background paper-grid">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <BrandLink />
          <nav className="hidden items-center gap-8 text-sm font-medium text-navy md:flex">
            <a href="#how">How it works</a>
            <a href="#roles">Who it’s for</a>
            <Link href="/trucks">Available trucks</Link>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {currentUser ? (
              <Link
                href={appHref}
                className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-navy">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="rounded-lg border border-line px-3 py-1.5 text-sm md:hidden"
            onClick={() => setMenu((v) => !v)}
          >
            Menu
          </button>
        </div>
        {menu ? (
          <div className="space-y-2 border-t border-line px-4 py-4 md:hidden">
            <Link href="/trucks" className="block py-1">
              Available trucks
            </Link>
            <Link href="/login" className="block py-1">
              Log in
            </Link>
            <Link href="/register" className="block py-1 font-semibold text-brand">
              Get started
            </Link>
          </div>
        ) : null}
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Direct cargo–truck marketplace
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.1] text-navy sm:text-5xl">
            Find a truck. Call the owner. Skip the broker.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            iBanga connects cargo owners with truck owners. Book an available
            truck and it becomes unavailable immediately. Then agree the price.
            If the owner rejects, the truck is available again.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register?role=IMPORTER"
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              I need a truck
            </Link>
            <Link
              href="/register?role=TRUCK_OWNER"
              className="rounded-xl border border-navy bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-soft"
            >
              I have trucks
            </Link>
          </div>
          <p className="mt-6 max-w-lg text-sm text-muted">
            No in-app payments, no commission in this MVP. You settle the
            transport fee directly with the owner.
          </p>
        </div>

        <div className="rounded-[2rem] border border-line bg-card p-3 shadow-[0_24px_60px_rgba(15,23,42,0.1)] sm:p-4">
          <p className="px-2 pt-2 text-sm font-medium text-muted">
            sample listing for truck owner
          </p>
          <div className="mt-3 grid grid-cols-2 gap-1 overflow-hidden rounded-2xl">
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
          <div className="mt-3 rounded-2xl bg-navy p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-2xl">Container · 28 tons</p>
                <p className="mt-1 text-white/70">RAD 452 C · Kigali</p>
              </div>
              <span className="rounded-full bg-good px-3 py-1 text-xs font-semibold">
                AVAILABLE
              </span>
            </div>
            <p className="mt-5 text-sm text-white/70">Preferred route</p>
            <p className="font-medium">Kigali — Mombasa</p>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/photos/ibanga-owner-eric.png"
                  alt="Eric Ndayisaba"
                  className="h-11 w-11 rounded-full object-cover"
                />
                <div>
                  <p className="text-white/60">Owner</p>
                  <p>Eric Ndayisaba</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/60">Contact off-platform</p>
                <p>+250 789 330 112</p>
              </div>
            </div>
          </div>
          <p className="px-2 py-3 text-sm text-muted">
            Book it and this truck leaves search immediately. Agree the price,
            then Eric accepts or rejects. Reject puts it back on the market.
          </p>
        </div>
      </section>

      <section id="how" className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl text-navy">How iBanga works</h2>
          <p className="mt-2 max-w-2xl text-muted">
            One simple path from listing to confirmed delivery. The platform
            never acts as a broker.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.n}
                className="rounded-2xl border border-line bg-background p-5"
              >
                <p className="font-display text-sm text-brand">{step.n}</p>
                <h3 className="mt-2 font-display text-xl text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roles" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl text-navy">Three workspaces</h2>
        <p className="mt-2 text-muted">
          Everyone uses the same site. What you see depends on your role.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <RoleCard
            title="Importer"
            text="Search trucks, view owner contacts, book a journey, confirm goods arrived — or flag a problem."
            href="/register?role=IMPORTER"
            cta="Register as importer"
          />
          <RoleCard
            title="Truck owner"
            text="List trucks, switch availability, accept or reject requests, update trip status, mark delivered."
            href="/register?role=TRUCK_OWNER"
            cta="Register as owner"
          />
          <RoleCard
            title="Admin"
            text="Watch users, trucks and bookings. Resolve disputes so a locked truck can work again."
            href="/login"
            cta="Admin sign-in"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["/photos/ibanga-flatbed.png", "Flatbed"],
            ["/photos/ibanga-reefer.png", "Refrigerated"],
            ["/photos/ibanga-tanker.png", "Tanker"],
            ["/photos/ibanga-semi.png", "Semi-trailer"],
          ].map(([src, label]) => (
            <figure key={label} className="overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={label} className="h-28 w-full object-cover sm:h-36" />
              <figcaption className="bg-card px-3 py-2 text-sm text-muted">
                {label}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-[2rem] bg-navy px-6 py-10 text-white sm:px-10">
          <h2 className="font-display text-3xl">Ready to move cargo?</h2>
          <p className="mt-3 max-w-xl text-white/70">
             discovery, direct contact, booking, lock,
            delivery and confirmation. Payments stay between you and the owner.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/trucks"
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold"
            >
              Browse trucks
            </Link>
            <Link
              href="/login"
              className="rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-4 py-8 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>iBanga · cargo–truck marketplace · web MVP</span>
          <span>No broker. No in-app payment.</span>
        </div>
      </footer>
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
