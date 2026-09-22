"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { TruckBadge } from "@/components/status-badge";
import { useIbanga } from "@/lib/store";

export default function AdminTrucksPage() {
  const { trucks, refreshTrucks } = useIbanga();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshTrucks().then((message) => setError(message));
  }, [refreshTrucks]);

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl tracking-tight text-navy">Trucks</h1>
            <p className="mt-1.5 text-sm text-muted">
              Available trucks currently listed on iBanga.
            </p>
          </div>
        </div>
        {error ? (
          <p className="mt-4 inline-flex rounded-xl bg-bad-soft px-3 py-2 text-sm font-medium text-bad">
            {error}
          </p>
        ) : null}
        <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-background/60">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-muted">Plate</th>
                <th className="px-5 py-3.5 font-semibold text-muted">Type</th>
                <th className="px-5 py-3.5 font-semibold text-muted">Owner</th>
                <th className="px-5 py-3.5 font-semibold text-muted">Location</th>
                <th className="px-5 py-3.5 font-semibold text-muted">Status</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map((truck) => {
                return (
                  <tr key={truck.id} className="border-b border-line bg-white transition-colors last:border-0 hover:bg-background/50">
                    <td className="px-5 py-4 font-semibold text-navy">{truck.plateNumber}</td>
                    <td className="px-5 py-4">
                      {truck.truckType} · {truck.capacity}
                    </td>
                    <td className="px-5 py-4">{truck.owner?.name ?? "—"}</td>
                    <td className="px-5 py-4 text-muted">{truck.currentLocation}</td>
                    <td className="px-5 py-4">
                      <TruckBadge status={truck.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}
