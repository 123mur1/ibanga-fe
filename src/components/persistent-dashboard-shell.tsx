"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { useIbanga } from "@/lib/store";

export function PersistentDashboardShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentUser } = useIbanga();
  const isDashboardRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isTruckBookingRoute =
    pathname === "/trucks" ||
    pathname.startsWith("/trucks/") ||
    pathname === "/bookings/new";

  const content =
    !currentUser || (!isDashboardRoute && !isTruckBookingRoute) ? (
      children
    ) : (
      <DashboardShell role={currentUser.role}>{children}</DashboardShell>
    );

  return (
    <>
      {content}
      {!isDashboardRoute && footer}
    </>
  );
}
