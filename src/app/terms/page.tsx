import Link from "next/link";
import { PublicNavbar } from "@/components/public-navbar";

const sections = [
  {
    title: "Accounts",
    body: "You may register as an importer or a truck owner. Creating an account means you accept these terms. Keep your login private and give a reachable phone number.",
  },
  {
    title: "Bookings and payment",
    body: "An importer pays the listed truck price at the moment of booking, using a Visa card, Airtel Money, or MTN MoMo. The receipt records the exact date and time, the payer, the masked account, the route, and the amount.",
  },
  {
    title: "Escrow",
    body: "The payment stays authorized until the truck owner confirms the truck is available. It then moves into the iBanga system account and is held. It is released only after the owner confirms the cargo was delivered and the importer confirms it was received. If the trip does not complete, iBanga refunds the original payment method.",
  },
  {
    title: "Live location",
    body: "The importer, the truck owner, and iBanga administrators can follow the cargo. The owner records departure, rest stops, and a position at least every two kilometres.",
  },
  {
    title: "Disputes",
    body: "Either side can report a problem before receipt is confirmed. Held funds stay in the system account until an administrator refunds them or the importer confirms receipt after review.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm font-semibold text-brand">iBanga</p>
        <h1 className="mt-2 text-3xl font-semibold text-navy">Terms and conditions</h1>
        <p className="mt-3 text-base text-muted">
          These terms govern accounts, bookings, escrow, refunds, and live cargo tracking on iBanga.
        </p>
        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-line bg-card p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-navy">{section.title}</h2>
              <p className="mt-2 text-base leading-7 text-navy/90">{section.body}</p>
            </section>
          ))}
        </div>
        <Link href="/register" className="mt-8 inline-flex text-sm font-semibold text-brand hover:text-brand-dark">
          Back to registration
        </Link>
      </main>
    </div>
  );
}
