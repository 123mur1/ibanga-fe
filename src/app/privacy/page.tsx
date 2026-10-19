import { PublicPage } from "@/components/public-page";
import { Notice } from "@/components/common/notices";

export const metadata = {
  title: "Privacy policy | iBanga",
  description: "How iBanga collects, uses and protects personal and business information.",
};

const sections = [
  {
    title: "What we collect",
    body: "Account details (name, email, phone, company and location), identity and company documents, vehicle and driver documents, cargo and booking details, delivery evidence such as photos and recipient names, and support messages. We also keep basic technical logs to keep the service secure.",
  },
  {
    title: "How we use it",
    body: "To create and secure your account, verify trucks, drivers and companies, match cargo with trucks, run bookings and shipments, process payments and settlements, handle refunds and disputes, send service notifications and meet legal obligations.",
  },
  {
    title: "Who can see what",
    body: "Importers see their own requests, bookings, shipments and payments. Truck owners see their own trucks, drivers, bookings and earnings. When a booking is made, the other party sees the details needed to complete it, such as route, cargo and contact information. Administrators see records they need for verification, support and compliance, and their actions are logged.",
  },
  {
    title: "Payments",
    body: "iBanga does not store full card numbers, mobile money PINs or bank passwords. Payments are processed by licensed payment providers and iBanga keeps only references, masked account details and receipts.",
  },
  {
    title: "Documents and evidence",
    body: "Uploaded documents and delivery photos are used only for verification, disputes, insurance and compliance. Access is limited to the parties involved and authorised administrators.",
  },
  {
    title: "Retention and your choices",
    body: "We keep records for as long as needed for your account and for financial and legal requirements. You can ask to correct or delete personal information that we are not required to keep, and you can manage notification preferences in Settings.",
  },
  {
    title: "Contact",
    body: "Questions about privacy can be sent through the Contact page or to privacy@ibanga.com.",
  },
];

export default function PrivacyPage() {
  return (
    <PublicPage eyebrow="Legal" title="Privacy policy" intro="How iBanga handles personal and business information." width="max-w-3xl">
      <Notice tone="warning" title="Draft for review">
        This policy is a draft for the demonstration build. It must be reviewed against Rwandan data-protection law and the final product before launch.
      </Notice>
      <div className="mt-6 space-y-4">
        {sections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-line bg-card p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-navy">{section.title}</h2>
            <p className="mt-2 text-base leading-7 text-navy/90">{section.body}</p>
          </section>
        ))}
      </div>
    </PublicPage>
  );
}
