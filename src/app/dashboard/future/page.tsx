"use client";

import { PlannedBanner, PlannedFeature } from "@/components/common/planned-feature";
import { RoleShell } from "@/components/common/role-shell";
import { PageHeader } from "@/components/ui";

const FEATURES = [
  {
    title: "Route optimisation",
    description: "Suggest efficient routes and stop orders that reduce distance, border waiting and fuel.",
    needs: ["A routing and traffic data provider", "Truck, cargo and border-crossing constraints", "Backend optimisation service"],
  },
  {
    title: "Live GPS tracking",
    description: "Show the real position of a truck on the map and update arrival times automatically.",
    needs: ["Driver app or telematics device integration", "A location ingestion API and storage", "Privacy and consent rules for drivers"],
  },
  {
    title: "Automated truck matching",
    description: "Recommend the best available trucks for each cargo request using capacity, route, price and reliability.",
    needs: ["A matching service with historical performance data", "Real availability from truck calendars", "Fairness and audit rules for recommendations"],
  },
  {
    title: "Predicted arrival times",
    description: "Estimate when cargo will arrive based on traffic, borders, weather and past trips.",
    needs: ["Live location data", "Historical trip and border-delay data", "A validated prediction model with measured accuracy"],
  },
  {
    title: "Advanced operational analytics",
    description: "Forecast demand, find bottlenecks and compare lanes, owners and drivers over time.",
    needs: ["A data warehouse fed by the real backend", "Agreed KPI definitions", "Role-based access to analytics"],
  },
  {
    title: "Recurring shipments",
    description: "Schedule repeat shipments (weekly or monthly) for regular importers with preferred owners.",
    needs: ["Scheduling and reminders on the backend", "Contract and price rules for repeats", "Automatic quotation and payment handling"],
  },
  {
    title: "Multi-stop deliveries",
    description: "Combine several pickups and drop-offs on one truck and optimise the order of stops.",
    needs: ["A multi-stop data model for bookings and shipments", "Per-stop proof of delivery and pricing", "Route optimisation service"],
  },
];

export default function FuturePage() {
  return (
    <RoleShell>
      <PageHeader
        eyebrow="Roadmap"
        title="Planned features"
        subtitle="Capabilities that are designed for but not built yet. They stay separate from the core booking and shipment workflows."
      />
      <div className="mt-6">
        <PlannedBanner />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map((feature) => (
          <PlannedFeature key={feature.title} {...feature} />
        ))}
      </div>
    </RoleShell>
  );
}
