import Link from "next/link";
import { PublicPage } from "@/components/public-page";

export const metadata = {
  title: "How it works | iBanga",
  description: "How importers, truck owners, drivers and administrators move cargo on iBanga, from request to settlement.",
};

const importerSteps = [
  { title: "Choose an available truck", text: "Browse trucks and compare their listed price, capacity, location and preferred route. Open a listing to check its details." },
  { title: "Send a booking request", text: "Choose a truck, then enter your cargo details, pickup and destination, dates and any driver instructions. Sending the request does not charge you." },
  { title: "Wait for the owner", text: "The truck owner reviews your request and confirms availability or declines it. No payment is due while you wait." },
  { title: "Pay after confirmation", text: "Once the owner accepts, pay the listed price by Visa, MTN MoMo or Airtel Money. iBanga holds your payment, and the trip can start once payment is recorded." },
  { title: "Track and confirm delivery", text: "Follow trip updates as the owner records progress. When the cargo is marked delivered, confirm receipt or report a problem. Your payment stays held while delivery issues are reviewed." },
];

const ownerSteps = [
  { title: "Register and verify", text: "Add your company, trucks and drivers with their documents. Verified, in-date documents are required to take work." },
  { title: "Find opportunities", text: "Browse open cargo requests that match your trucks and send a quotation with your price and dates." },
  { title: "Assign a driver", text: "Once your quotation is accepted, assign an eligible driver and truck. Conflicts and expired documents are flagged." },
  { title: "Run the trip", text: "Record pickup, loading and departure, report delays, and submit delivery evidence on arrival." },
  { title: "Get settled", text: "After delivery is verified and no dispute or incident holds the booking, your settlement is approved, minus the platform fee." },
];

const adminSteps = [
  { title: "Verify the marketplace", text: "Review identity, company, vehicle, driver and insurance documents and monitor expiry dates." },
  { title: "Oversee operations", text: "Watch bookings and shipments, verify delivery evidence and manage incidents and insurance claims." },
  { title: "Control the money", text: "Review settlements, refunds and cancellations, and reconcile platform records. Every action is confirmed and audit-logged." },
  { title: "Resolve cases", text: "Investigate disputes, request information, record decisions and answer support tickets." },
];

const driverSteps = [
  { title: "Sign in to your driver workspace", text: "Your truck owner creates your account and associates it with a truck. Use the email and initial password they provide." },
  { title: "Check your assigned cargo", text: "Your trips show only after the owner assigns you to a shipment. Confirm pickup, loading and departure as they happen." },
  { title: "Keep everyone updated", text: "Report delays and submit delivery evidence with the recipient details and photos when cargo arrives." },
];

function Track({ title, accent, steps }: { title: string; accent: string; steps: { title: string; text: string }[] }) {
  return (
    <section className="rounded-3xl border border-line bg-card p-6 shadow-soft sm:p-8">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${accent}`} aria-hidden="true" />
        <h2 className="font-display text-xl text-navy">{title}</h2>
      </div>
      <ol className="mt-5 space-y-5">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-dark">{index + 1}</span>
            <div>
              <h3 className="font-semibold text-navy">{step.title}</h3>
              <p className="mt-0.5 text-sm leading-6 text-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function HowItWorksPage() {
  return (
    <PublicPage
      eyebrow="How it works"
      title="From cargo request to settlement"
      intro="iBanga connects importers, truck owners, drivers and administrators in one clear process. Here is what each side does."
      width="max-w-6xl"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Track title="For importers" accent="bg-brand" steps={importerSteps} />
        <Track title="For truck owners" accent="bg-navy" steps={ownerSteps} />
        <Track title="For drivers" accent="bg-accent" steps={driverSteps} />
      </div>
      <div className="mt-6">
        <Track title="Behind the scenes: administrators" accent="bg-good" steps={adminSteps} />
      </div>

      <section className="mt-8 rounded-3xl bg-brand px-6 py-8 text-white sm:px-10">
        <h2 className="font-display text-2xl">Built so money and cargo are never left to chance</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-white/90 sm:grid-cols-3">
          <li>A quotation is an offer. Only an accepted quotation becomes a booking, and only confirmed payment unlocks the trip.</li>
          <li>Submitted delivery evidence is not the same as verified delivery. Settlement waits for verification and any dispute to end.</li>
          <li>Cancellations show their fees before you confirm, and refunds are reviewed rather than assumed.</li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/#available-trucks" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark hover:bg-brand-soft">Browse trucks</Link>
          <Link href="/register?role=TRUCK_OWNER" className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">List your truck</Link>
        </div>
      </section>
    </PublicPage>
  );
}
