"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { useIbanga } from "@/lib/store";

export function PersistentDashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentUser } = useIbanga();
  const isDashboardRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isTruckBookingRoute =
    pathname === "/trucks" ||
    pathname.startsWith("/trucks/") ||
    pathname === "/bookings/new";

  if (!currentUser || (!isDashboardRoute && !isTruckBookingRoute)) {
    return <>{children}</>;
  }

  return (
    <DashboardShell role={currentUser.role}>{children}</DashboardShell>
  );
}
