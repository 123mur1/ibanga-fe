"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/ui";
import { TruckThumb } from "@/components/photos";
import { useIbanga } from "@/lib/store";

export default function AdminTrucksPage() {
  const { trucks, refreshTrucks } = useIbanga();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshTrucks().then((message) => setError(message));
  }, [refreshTrucks]);

  const available = trucks.filter((t) => t.status === "AVAILABLE").length;

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <PageHeader
          eyebrow="Marketplace"
          title="Trucks"
          subtitle={`${available} of ${trucks.length} trucks currently available to book.`}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
              <circle cx="7.5" cy="17.5" r="1.8" />
              <circle cx="17.5" cy="17.5" r="1.8" />
            </svg>
          }
        />

        {error ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
            {error}
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trucks.map((truck) => (
            <article
              key={truck.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="relative">
                <TruckThumb photos={truck.photos} alt={truck.plateNumber} className="aspect-4/3" />
                <div className="absolute left-3 top-3">
                  <TruckBadge status={truck.status} />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg leading-tight text-navy">
                      {truck.plateNumber}
                    </p>
                    <p className="text-sm text-muted">
                      {truck.truckType} · {truck.capacity} tons
                    </p>
                  </div>
                </div>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Owner</dt>
                    <dd className="truncate font-medium text-navy">
                      {truck.owner?.name ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Location</dt>
                    <dd className="font-medium text-navy">{truck.currentLocation}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Route</dt>
                    <dd className="text-right font-medium text-navy">
                      {truck.preferredRoute}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}