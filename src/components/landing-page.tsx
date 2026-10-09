"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TruckCard } from "./truck-card";
import { PublicNavbar } from "./public-navbar";
import { useIbanga } from "@/lib/store";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/types";

const heroSlides = [
  {
    image: "/photos/ibanga-container-highway.png",
    eyebrow: "Freight moves forward",
    title: "The right truck for every journey.",
    text: "Find dependable regional transport, compare clear prices, and keep every booking in one place.",
  },
  {
    image: "/photos/ibanga-container-yard.png",
    eyebrow: "A clearer way to move cargo",
    title: "Connect your cargo to the road.",
    text: "Bring importers and verified truck owners together with simple, transparent freight booking.",
  },
  {
    image: "/photos/ibanga-reefer.png",
    eyebrow: "Built for business",
    title: "From first booking to final delivery.",
    text: "Track the journey, stay in control, and keep your logistics moving with iBanga.",
  },
];

export function LandingPage() {
  const { trucks, bookings } = useIbanga();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % heroSlides.length),
      5500,
    );
    return () => window.clearInterval(timer);
  }, []);

  const featuredTrucks = trucks
    .filter((truck) => truck.status === "AVAILABLE")
    .slice(0, 6);
  const availableTruckCount = trucks.filter((truck) => truck.status === "AVAILABLE").length;
  const activeLoadCount = bookings.filter((booking) =>
    ACTIVE_BOOKING_STATUSES.includes(booking.status),
  ).length;
  const slide = heroSlides[activeSlide];

  return (
    <div className="min-h-screen bg-white text-foreground">
      <PublicNavbar />

      <main>
        <section
          id="home"
          aria-label="iBanga freight marketplace"
          className="relative isolate flex min-h-[600px] items-center overflow-hidden bg-navy sm:min-h-[660px]"
        >
          {heroSlides.map((item, index) => (
            <div
              key={item.image}
              aria-hidden="true"
              className={`absolute inset-0 -z-10 bg-cover bg-center transition-opacity duration-1000 ${activeSlide === index ? "opacity-100" : "opacity-0"}`}
              style={{ backgroundImage: `url("${item.image}")` }}
            />
          ))}
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#062839]/90 via-[#06334b]/70 to-[#06334b]/25" />
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:px-12">
            <div key={slide.title} className="max-w-3xl animate-fade-in">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-sky-300" />
                {slide.eyebrow}
              </p>
              <h1 className="mt-6 max-w-3xl font-display text-4xl leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
                {slide.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
                {slide.text}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/trucks" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50">
                  Browse available trucks
                </Link>
                <Link href="/register?role=TRUCK_OWNER" className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20">
                  List your truck
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-2" aria-label="Hero slides">
                {heroSlides.map((item, index) => (
                  <button
                    key={item.image}
                    type="button"
                    aria-label={`Show slide ${index + 1}`}
                    aria-current={activeSlide === index}
                    onClick={() => setActiveSlide(index)}
                    className={`h-2.5 rounded-full transition-all ${activeSlide === index ? "w-9 bg-white" : "w-2.5 bg-white/50 hover:bg-white/80"}`}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-1">
              <article className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white shadow-xl backdrop-blur-md sm:p-5 lg:flex lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200 sm:text-xs sm:tracking-[0.18em]">Loads</p>
                  <p className="mt-2 font-display text-2xl font-bold sm:text-4xl">{activeLoadCount}</p>
                  <p className="mt-1 text-[10px] leading-4 text-white/75 sm:text-sm">Active bookings</p>
                </div>
              </article>
              <article className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white shadow-xl backdrop-blur-md sm:p-5 lg:flex lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200 sm:text-xs sm:tracking-[0.18em]">Trucks</p>
                  <p className="mt-2 font-display text-2xl font-bold sm:text-4xl">{availableTruckCount}</p>
                  <p className="mt-1 text-[10px] leading-4 text-white/75 sm:text-sm">Available now</p>
                </div>
              </article>
              <article className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white shadow-xl backdrop-blur-md sm:p-5 lg:flex lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200 sm:text-xs sm:tracking-[0.18em]">Reliability</p>
                  <p className="mt-2 font-display text-2xl font-bold sm:text-3xl">Live</p>
                  <p className="mt-1 text-[10px] leading-4 text-white/75 sm:text-sm">Booking updates</p>
                </div>
              </article>
            </div>
          </div>
          <span className="absolute bottom-0 left-0 h-1 w-full bg-white/10">
            <span key={activeSlide} className="block h-full origin-left animate-slide-progress bg-sky-300" />
          </span>
        </section>

        <section id="available-trucks" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Ready to move</p>
                <h2 className="mt-2 font-display text-3xl tracking-tight text-navy sm:text-4xl">Available trucks</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                  Explore transport options, review their routes and listed rates, and choose the right fit for your cargo.
                </p>
              </div>
              <Link href="/trucks" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-dark">
                Browse all trucks
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            {featuredTrucks.length ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featuredTrucks.map((truck) => <TruckCard key={truck.id} truck={truck} />)}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center text-sm text-muted">
                New trucks are being added to the marketplace.
              </div>
            )}
          </div>
        </section>

        <section id="about" className="scroll-mt-24 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">About iBanga</p>
                <h2 className="mt-3 max-w-xl font-display text-3xl leading-tight tracking-tight text-navy sm:text-4xl">
                  Built to simplify cargo movement.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-muted">
                  iBanga brings importers and truck owners together to find transport, arrange bookings, and follow each trip through delivery.
                </p>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
                One clear path from listing to confirmed delivery, with cargo details, listed prices, and booking progress available in one place.
              </p>
            </div>

            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">How it works</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: "Owner lists a truck",
                    description: "The truck stays available until someone books it.",
                  },
                  {
                    title: "Importer books it",
                    description: "Cargo and journey details are sent. The truck becomes unavailable right away.",
                  },
                  {
                    title: "Pay the listed price",
                    description: "The owner sets a fixed price. Pay from your iBanga wallet after acceptance.",
                  },
                  {
                    title: "Owner accepts or rejects",
                    description: "Accepting keeps the truck locked for the trip. Rejecting makes it available again.",
                  },
                  {
                    title: "Move the cargo",
                    description: "The owner starts the trip and marks it delivered.",
                  },
                  {
                    title: "Confirm or dispute",
                    description: "The importer confirms receipt or reports a problem. The truck is released after the trip is completed.",
                  },
                ].map((step, index) => (
                  <article key={step.title} className="rounded-2xl border border-line bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand">{String(index + 1).padStart(2, "0")}</span>
                      <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-sm text-brand">→</span>
                    </div>
                    <h3 className="mt-4 font-display text-lg text-navy">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-14">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">What partners say</p>
                <h2 className="mt-2 font-display text-2xl tracking-tight text-navy sm:text-3xl">
                  Trusted by teams moving cargo every day
                </h2>
              </div>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
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
                ].map((review) => (
                  <article key={review.name} className="flex h-full flex-col rounded-3xl border border-line bg-white p-6 shadow-sm">
                    <div aria-label="5 out of 5 stars" className="flex gap-1 text-lg leading-none text-amber-500">
                      {Array.from({ length: 5 }, (_, index) => (
                        <span key={index} aria-hidden="true">★</span>
                      ))}
                    </div>
                    <blockquote className="mt-5 flex-1 text-sm leading-6 text-slate-700">
                      “{review.quote}”
                    </blockquote>
                    <div className="mt-5 border-t border-line pt-4">
                      <p className="text-sm font-semibold text-navy">{review.name}</p>
                      <p className="mt-1 text-xs text-muted">{review.role}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#06334b] text-white">
        <div id="contact" className="scroll-mt-24 mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
          <div className="mb-7 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-200">Contact iBanga</p>
            <h2 className="mt-2 font-display text-2xl text-white sm:text-3xl">We’re here to help your freight move.</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              For marketplace questions or support with a booking, reach out using the contact details below.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Telephones</h3>
              <a href="tel:+250780000001" className="mt-3 block text-base font-semibold text-white hover:text-sky-200">+250 780 000 001</a>
              <a href="tel:+250788441220" className="mt-2 block text-base font-semibold text-white hover:text-sky-200">+250 788 441 220</a>
            </section>
            <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Email &amp; reception</h3>
              <a href="mailto:admin@ibanga.com" className="mt-3 block break-all text-base font-semibold text-white hover:text-sky-200">admin@ibanga.com</a>
              <p className="mt-2 text-xs leading-5 text-white/60">For general enquiries and reception.</p>
            </section>
            <section className="rounded-2xl border border-white/15 bg-white/5 p-5 sm:col-span-2 lg:col-span-1">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Address</h3>
              <address className="mt-3 text-base font-semibold not-italic leading-6 text-white">KN 85 Street<br />Nyarugenge, Kigali<br />Rwanda</address>
            </section>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
            <span>© {new Date().getFullYear()} iBanga. Freight moves forward.</span>
            <span>Built for the regional logistics community.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
