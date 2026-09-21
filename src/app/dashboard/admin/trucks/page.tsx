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
        <h1 className="font-display text-3xl text-navy">Trucks</h1>
        <p className="mt-1 text-muted">Available trucks currently listed on iBanga.</p>
        {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Plate</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map((truck) => {
                return (
                  <tr key={truck.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-semibold">{truck.plateNumber}</td>
                    <td className="px-4 py-3">
                      {truck.truckType} · {truck.capacity}
                    </td>
                    <td className="px-4 py-3">{truck.owner?.name ?? "—"}</td>
                    <td className="px-4 py-3">{truck.currentLocation}</td>
                    <td className="px-4 py-3">
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
