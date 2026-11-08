"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TruckBrowser } from "./truck-browser";
import { PublicNavbar } from "./public-navbar";
import { useIsTruckVerified } from "@/hooks/use-truck-verification";
import { useIbanga } from "@/lib/store";
import { CONTACT, telHref } from "@/config/contact";
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
  const isVerified = useIsTruckVerified();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % heroSlides.length),
      5500,
    );
    return () => window.clearInterval(timer);
  }, []);

  // Importers and visitors only ever see verified trucks; the API applies the same rule.
  const availableTruckCount = trucks.filter((truck) => truck.status === "AVAILABLE" && isVerified(truck)).length;
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
                <Link href="#available-trucks" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <article className="rounded-xl border border-white/15 border-l-4 border-l-sky-300 bg-[#082b3b]/90 p-4 text-white shadow-lg sm:p-5 lg:flex lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Loads</p>
                  <p className="mt-2 font-display text-3xl font-semibold tabular-nums sm:text-4xl">{activeLoadCount}</p>
                  <p className="mt-1 text-sm text-white/75">Active bookings</p>
                </div>
              </article>
              <article className="rounded-xl border border-white/15 border-l-4 border-l-sky-300 bg-[#082b3b]/90 p-4 text-white shadow-lg sm:p-5 lg:flex lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Trucks</p>
                  <p className="mt-2 font-display text-3xl font-semibold tabular-nums sm:text-4xl">{availableTruckCount}</p>
                  <p className="mt-1 text-sm text-white/75">Available now</p>
                </div>
              </article>
              <article className="rounded-xl border border-white/15 border-l-4 border-l-sky-300 bg-[#082b3b]/90 p-4 text-white shadow-lg sm:p-5 lg:flex lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Trip visibility</p>
                  <p className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Live</p>
                  <p className="mt-1 text-sm text-white/75">Updates along the route</p>
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
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Ready to move</p>
              <h2 className="mt-2 font-display text-3xl tracking-tight text-navy sm:text-4xl">Available trucks</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                Explore transport options, review their routes and listed rates, and choose the right fit for your cargo.
              </p>
            </div>

            <TruckBrowser />
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
              {CONTACT.phones.map((phone, index) => (
                <a key={phone.display} href={telHref(phone.display)} className={`${index === 0 ? "mt-3" : "mt-2"} block text-base font-semibold text-white hover:text-sky-200`}>{phone.display}</a>
              ))}
            </section>
            <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Email &amp; reception</h3>
              <a href={`mailto:${CONTACT.email}`} className="mt-3 block break-all text-base font-semibold text-white hover:text-sky-200">{CONTACT.email}</a>
              <p className="mt-2 text-xs leading-5 text-white/60">For general enquiries and reception.</p>
            </section>
            <section className="rounded-2xl border border-white/15 bg-white/5 p-5 sm:col-span-2 lg:col-span-1">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-200">Address</h3>
              <address className="mt-3 text-base font-semibold not-italic leading-6 text-white">{CONTACT.address.map((line) => <span key={line} className="block">{line}</span>)}</address>
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
