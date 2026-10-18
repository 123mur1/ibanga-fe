import Link from "next/link";
import { PublicNavbar } from "@/components/public-navbar";

const steps = [
  {
    title: "Owner lists a truck",
    description: "The truck stays available until someone books it.",
    action: "List a truck",
    href: "/register?role=TRUCK_OWNER",
  },
  {
    title: "Importer books it",
    description: "Cargo and journey details are sent. The truck becomes unavailable right away.",
    action: "Browse available trucks",
    href: "/#available-trucks",
  },
  {
    title: "Pay the listed price",
    description: "The owner sets a fixed price. Pay by card or mobile money after acceptance.",
    action: "View your payments",
    href: "/dashboard/importer/payments",
  },
  {
    title: "Owner accepts or rejects",
    description: "Accepting keeps the truck locked for the trip. Rejecting makes it available again.",
    action: "Review bookings",
    href: "/dashboard/owner/bookings",
  },
  {
    title: "Move the cargo",
    description: "The owner starts the trip and marks it delivered.",
    action: "Track live cargo",
    href: "/dashboard/tracking",
  },
  {
    title: "Confirm or dispute",
    description: "The importer confirms receipt or reports a problem. The truck is released after the trip is completed.",
    action: "Review your bookings",
    href: "/dashboard/importer/bookings",
  },
];

const reviews = [
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
];

export const metadata = {
  title: "About iBanga",
  description: "How the iBanga freight marketplace works and what partners say about it.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      <PublicNavbar />

      <main>
        <section id="about" className="scroll-mt-24 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">About iBanga</p>
                <h1 className="mt-3 max-w-xl font-display text-3xl leading-tight tracking-tight text-navy sm:text-4xl">
                  Built to simplify cargo movement.
                </h1>
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
                {steps.map((step, index) => (
                  <article key={step.title} className="group rounded-2xl border border-line bg-slate-50 p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-card">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-brand">{String(index + 1).padStart(2, "0")}</span>
                      <Link
                        href={step.href}
                        aria-label={step.action}
                        title={step.action}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-sm text-brand transition duration-200 group-hover:translate-x-1 group-hover:bg-brand group-hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                    <h3 className="mt-4 font-display text-lg text-navy">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
                    <p className="mt-4 text-xs font-semibold text-brand">{step.action}</p>
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
                {reviews.map((review) => (
                  <article key={review.name} className="flex h-full flex-col rounded-3xl border border-line bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-brand/30 hover:shadow-card">
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

            <div className="mt-14 text-center">
              <Link
                href="/#available-trucks"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/15 transition hover:-translate-y-0.5 hover:bg-brand-dark"
              >
                See available trucks
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} iBanga. Freight moves forward.</span>
          <Link href="/register?role=TRUCK_OWNER" className="font-semibold text-brand hover:text-brand-dark">List your truck</Link>
        </div>
      </footer>
    </div>
  );
}
