"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { StatusBars } from "@/components/charts";
import { DashboardWelcomeCard, GhostButton, StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import type { Booking, BookingStatus, Role } from "@/lib/types";
import Link from "next/link";

const STATUS_FLOW: { status: BookingStatus; label: string; tone: string }[] = [
  { status: "PENDING", label: "Pending", tone: "bg-brand/40 text-white" },
  { status: "ACCEPTED", label: "Accepted", tone: "bg-brand/60 text-white" },
  { status: "IN_PROGRESS", label: "In progress", tone: "bg-brand/80 text-white" },
  { status: "DELIVERED", label: "Delivered", tone: "bg-brand text-white" },
  { status: "COMPLETED", label: "Completed", tone: "bg-brand-dark text-white" },
  { status: "DISPUTED", label: "Disputed", tone: "bg-navy text-white" },
  { status: "REJECTED", label: "Rejected", tone: "bg-line text-muted" },
];

const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: "#cfe6ef",
  ACCEPTED: "#a3cfe0",
  IN_PROGRESS: "#5aa3c0",
  DELIVERED: "#00628b",
  COMPLETED: "#0a3d50",
  DISPUTED: "#122832",
  REJECTED: "#d5e0e7",
};

type AdminReportUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  location: string | null;
  company: string | null;
  createdAt: string;
};

type ReportKind = "overview" | "bookings" | "trucks" | "users";

function getMonthlyBookingCounts(bookings: Booking[]) {
  const now = new Date();
  const firstMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
  );
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth() + index, 1),
    );
    return {
      label: date.toLocaleDateString("en", { month: "short", timeZone: "UTC" }),
      count: 0,
    };
  });

  for (const booking of bookings) {
    const createdAt = new Date(booking.createdAt);
    if (Number.isNaN(createdAt.getTime())) continue;
    const monthIndex =
      (createdAt.getUTCFullYear() - firstMonth.getUTCFullYear()) * 12 +
      createdAt.getUTCMonth() -
      firstMonth.getUTCMonth();
    if (monthIndex >= 0 && monthIndex < months.length) {
      months[monthIndex].count += 1;
    }
  }

  return months;
}

function getMonthlyUserRegistrations(users: AdminReportUser[]) {
  const now = new Date();
  const firstMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
  );
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth() + index, 1),
    );
    return {
      label: date.toLocaleDateString("en", { month: "short", timeZone: "UTC" }),
      IMPORTER: 0,
      TRUCK_OWNER: 0,
      ADMIN: 0,
    };
  });

  for (const user of users) {
    const createdAt = new Date(user.createdAt);
    if (Number.isNaN(createdAt.getTime())) continue;
    const monthIndex =
      (createdAt.getUTCFullYear() - firstMonth.getUTCFullYear()) * 12 +
      createdAt.getUTCMonth() -
      firstMonth.getUTCMonth();
    if (monthIndex >= 0 && monthIndex < months.length) {
      months[monthIndex][user.role] += 1;
    }
  }

  return months;
}

function downloadCsv(
  fileName: string,
  headers: string[],
  rows: unknown[][],
) {
  const escapeCell = (value: unknown) => {
    const text = String(value ?? "");
    const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replaceAll('"', '""')}"`;
  };
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function AdminHome() {
  const {
    trucks,
    bookings,
    disputes,
    users: accountUsers,
    adminCommission: commission,
    currentUser,
  } = useIbanga();
  const firstName = (currentUser?.name ?? "").split(" ")[0] || "there";
  const users: AdminReportUser[] = accountUsers.map((user) => ({
    ...user,
    phone: user.phone || null,
    location: user.location || null,
    company: user.company || null,
    createdAt: user.createdAt ?? new Date(0).toISOString(),
  }));
  const userCount = users.length;
  const [reportKind, setReportKind] = useState<ReportKind>("overview");
  const userCountError = false;
  const openDisputes = disputes.filter((d) => d.status === "OPEN").length;
  const availableTrucks = trucks.filter((truck) => truck.status === "AVAILABLE").length;
  const monthlyBookings = getMonthlyBookingCounts(bookings);
  const maxMonthlyBookings = Math.max(1, ...monthlyBookings.map((month) => month.count));
  const monthlyCommissions = (commission?.monthlyHistory ?? []).map(
    ({ month, totalRwf }) => ({
      label: new Date(`${month}-01T00:00:00Z`).toLocaleDateString("en", {
        month: "short",
        timeZone: "UTC",
      }),
      totalRwf,
    }),
  );
  const maxMonthlyCommission = Math.max(
    1,
    ...monthlyCommissions.map((month) => month.totalRwf),
  );
  const monthlyUserRegistrations = getMonthlyUserRegistrations(users);
  const maxRegistrations = Math.max(
    1,
    ...monthlyUserRegistrations.flatMap((month) => [month.IMPORTER, month.TRUCK_OWNER, month.ADMIN]),
  );
  const registrationSeries = [
    { key: "IMPORTER", label: "Importers", color: "#00628b" },
    { key: "TRUCK_OWNER", label: "Truck owners", color: "#3f86a5" },
    { key: "ADMIN", label: "Admins", color: "#8fbdd0" },
  ] as const;
  const registrationX = (index: number) =>
    44 + (index * 552) / Math.max(1, monthlyUserRegistrations.length - 1);
  const registrationY = (value: number) => 166 - (value / maxRegistrations) * 126;
  const registrationLines = registrationSeries.map((series) => ({
    ...series,
    points: monthlyUserRegistrations.map((month, index) => ({
      x: registrationX(index),
      y: registrationY(month[series.key]),
      value: month[series.key],
      label: month.label,
    })),
  }));
  const chartPoints = monthlyBookings.map((month, index) => ({
    ...month,
    x: 44 + (index * 552) / (monthlyBookings.length - 1),
    y: 166 - (month.count / maxMonthlyBookings) * 126,
  }));
  const bookingLinePath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const bookingAreaPath = `${bookingLinePath} L596,166 L44,166 Z`;

  const liveTrips = bookings.filter((booking) =>
    ["ACCEPTED", "IN_PROGRESS", "DELIVERED"].includes(booking.status),
  ).length;
  const payments = bookings.filter((booking) => booking.payment);
  const totalPayments = payments.length;
  const heldPayments = payments.filter((booking) => booking.payment?.status === "HELD").length;
  const openDisputeList = disputes.filter((dispute) => dispute.status === "OPEN");
  const totalPaymentsAmount = payments.reduce(
    (sum, booking) => sum + (booking.payment?.amountRwf ?? 0),
    0,
  );
  const earnedCommission = commission?.totalEarnedRwf ?? payments
    .filter((booking) => booking.payment?.status === "RELEASED")
    .reduce((sum, booking) => sum + (booking.payment?.commissionRwf ?? 0), 0);

  const statusSlices = STATUS_FLOW.map((step) => ({
    ...step,
    count: bookings.filter((booking) => booking.status === step.status).length,
    color: STATUS_COLORS[step.status],
  }));
  const statusTotal = Math.max(1, statusSlices.reduce((sum, slice) => sum + slice.count, 0));
  const donutRadius = 54;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const activeSlices = statusSlices.filter((slice) => slice.count > 0);
  const donutSlices = activeSlices.map((slice, index) => {
    const precedingFraction = activeSlices
      .slice(0, index)
      .reduce((sum, previous) => sum + previous.count / statusTotal, 0);
    const fraction = slice.count / statusTotal;
    return {
      ...slice,
      dash: fraction * donutCircumference,
      offset: precedingFraction * donutCircumference,
    };
  });

  function handleGenerateReport(format: "csv" | "pdf") {
    const generatedAt = new Date().toISOString();
    let headers: string[];
    let rows: unknown[][];

    if (reportKind === "bookings") {
      headers = [
        "Booking ID",
        "Created at",
        "Status",
        "Cargo type",
        "Importer ID",
        "Truck ID",
        "Pickup location",
        "Destination",
        "Agreed price RWF",
        "Payment status",
      ];
      rows = bookings.map((booking) => [
        booking.id,
        booking.createdAt,
        booking.status,
        booking.cargoType,
        booking.importerId,
        booking.truckId,
        booking.pickupLocation,
        booking.destination,
        booking.agreedPriceRwf ?? "",
        booking.payment?.status ?? "",
      ]);
    } else if (reportKind === "trucks") {
      headers = [
        "Truck ID",
        "Plate number",
        "Owner",
        "Owner ID",
        "Status",
        "Truck type",
        "Capacity tons",
        "Price RWF",
        "Current location",
        "Preferred route",
      ];
      rows = trucks.map((truck) => [
        truck.id,
        truck.plateNumber,
        truck.owner?.name ?? "",
        truck.ownerId,
        truck.status,
        truck.truckType,
        truck.capacity,
        truck.priceRwf ?? "",
        truck.currentLocation,
        truck.preferredRoute,
      ]);
    } else if (reportKind === "users") {
      headers = [
        "User ID",
        "Name",
        "Email",
        "Phone",
        "Role",
        "Location",
        "Company",
        "Created at",
      ];
      rows = users.map((user) => [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.role,
        user.location,
        user.company,
        user.createdAt,
      ]);
    } else {
      headers = [
        "Generated at",
        "Users",
        "Trucks total",
        "Trucks available",
        "Trucks unavailable",
        "Bookings total",
        "Open disputes",
        "Commission available RWF",
        "Commission earned RWF",
        ...STATUS_FLOW.map((step) => `${step.label} bookings`),
      ];
      rows = [[
        generatedAt,
        userCount ?? "Not loaded",
        trucks.length,
        availableTrucks,
        trucks.length - availableTrucks,
        bookings.length,
        openDisputes,
        commission?.availableRwf ?? "Not loaded",
        commission?.totalEarnedRwf ?? "Not loaded",
        ...STATUS_FLOW.map(
          (step) => bookings.filter((booking) => booking.status === step.status).length,
        ),
      ]];
    }

    const fileName = `ibanga-${reportKind}-${generatedAt.slice(0, 10)}`;
    if (format === "csv") {
      downloadCsv(`${fileName}.csv`, headers, rows);
      return;
    }

    const reportTitles: Record<ReportKind, string> = {
      overview: "Marketplace summary",
      bookings: "Booking report",
      trucks: "Fleet report",
      users: "User directory",
    };
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(`iBanga ${reportTitles[reportKind]}`, 36, 34);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`Generated ${new Date(generatedAt).toLocaleString("en-RW")}`, 36, 51);
    autoTable(pdf, {
      startY: 64,
      margin: { left: 36, right: 36, top: 64, bottom: 36 },
      head: [headers],
      body: rows.map((row) => row.map((value) => String(value ?? ""))),
      styles: {
        font: "helvetica",
        fontSize: 7,
        cellPadding: 4,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: { fillColor: [0, 98, 139], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [238, 242, 245] },
      didDrawPage: ({ pageNumber }) => {
        pdf.setFontSize(8);
        pdf.setTextColor(77, 100, 112);
        pdf.text(
          `iBanga marketplace report · Page ${pageNumber} of ${pdf.getNumberOfPages()}`,
          pdf.internal.pageSize.getWidth() - 36,
          pdf.internal.pageSize.getHeight() - 18,
          { align: "right" },
        );
      },
    });
    pdf.save(`${fileName}.pdf`);
  }

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <DashboardWelcomeCard
          title={`Hello, ${firstName}.`}
          description={
            openDisputes
              ? "Disputes are waiting for a decision. Resolve them to keep the marketplace fair."
              : "No open disputes. Keep an eye on payments, trucks and bookings from here."
          }
          actions={
            <>
              <Link
                href="/dashboard/admin/disputes"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
              >
                Review disputes
                {openDisputes ? (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{openDisputes}</span>
                ) : null}
              </Link>
              <Link
                href="/dashboard/admin/payments"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/15"
              >
                Payments
              </Link>
            </>
          }
          metric={String(liveTrips)}
          metricLabel="trips in motion"
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Commission available"
            value={commission ? `RWF ${commission.availableRwf.toLocaleString("en-RW")}` : "—"}
            hint={commission ? `Earned RWF ${commission.totalEarnedRwf.toLocaleString("en-RW")}` : "Loading"}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2v20M17 5.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
            accent="brand"
            href="/dashboard/admin/payments"
          />
          <StatCard
            label="Total payments"
            value={`RWF ${totalPaymentsAmount.toLocaleString("en-RW")}`}
            hint={`${totalPayments} payments · commission RWF ${earnedCommission.toLocaleString("en-RW")}`}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                <path d="M2.5 9.5h19M6 15h4" />
              </svg>
            }
            accent="accent"
            href="/dashboard/admin/payments"
          />
          <StatCard
            label="Users"
            value={userCount ?? "—"}
            hint={userCountError ? "Could not load" : userCount === null ? "Loading" : "All accounts"}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M3 20a6 6 0 0 1 12 0" />
                <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M17 14.5a6 6 0 0 1 4 5.5" />
              </svg>
            }
            accent="brand"
            href="/dashboard/admin/users"
          />
          <StatCard
            label="Open disputes"
            value={openDisputes}
            hint="Needs review"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3 2.5 20h19L12 3Z" />
                <path d="M12 9.5V14" />
                <path d="M12 17.5h.01" />
              </svg>
            }
            accent="warn"
            href="/dashboard/admin/disputes?status=OPEN"
          />
          <StatCard label="Trucks" value={trucks.length} hint={`${availableTrucks} available`} accent="good" href="/dashboard/admin/trucks" />
          <StatCard label="Bookings" value={bookings.length} hint="All marketplace requests" accent="accent" href="/dashboard/admin/bookings" />
          <StatCard label="Active trips" value={liveTrips} hint="Accepted, moving or delivered" accent="brand" href="/dashboard/admin/bookings?status=ACCEPTED,IN_PROGRESS,DELIVERED" />
          <StatCard label="Commission earned" value={`RWF ${earnedCommission.toLocaleString("en-RW")}`} hint="Released platform fees · 6%" accent="good" href="/dashboard/admin/payments?status=RELEASED" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <StatusBars
            title="Marketplace workload"
            caption="Cases, trips, held payments and fleet availability."
            items={[
              { label: "Disputes to review", value: openDisputes, tone: "warn" },
              { label: "Trips on the road", value: liveTrips, tone: "accent" },
              { label: "Payments held", value: heldPayments, tone: "brand" },
              { label: "Trucks available", value: availableTrucks, tone: "good" },
            ]}
          />
          <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-navy">Open disputes</h2>
              <Link href="/dashboard/admin/disputes" className="text-sm font-semibold text-brand">View all</Link>
            </div>
            <ul className="mt-4 space-y-3">
              {openDisputeList.length === 0 ? (
                <li className="text-sm text-muted">No disputes need your attention.</li>
              ) : openDisputeList.slice(0, 4).map((dispute) => {
                const booking = bookings.find((item) => item.id === dispute.bookingId);
                return (
                  <li key={dispute.id}>
                    <Link href={`/dashboard/admin/disputes/${dispute.id}`} className="font-semibold text-navy hover:text-brand">
                      {booking ? `${booking.pickupLocation} to ${booking.destination}` : dispute.bookingId}
                    </Link>
                    <p className="truncate text-sm text-muted">{dispute.reason}</p>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-sm text-muted">
              {trucks.length} trucks · {bookings.length} bookings across the marketplace.
            </p>
          </section>
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl tracking-tight text-navy">Marketplace analytics</h2>
              <p className="mt-1 text-sm text-muted">
                Trends and fleet availability from stored marketplace records.
              </p>
            </div>
            <span className="text-xs font-medium text-muted">Updated from live data</span>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <article className="min-w-0 rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg text-navy">Booking activity</h3>
                  <p className="mt-1 text-sm text-muted">New bookings created each month</p>
                </div>
                <span className="rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-dark">
                  Last 6 months
                </span>
              </div>
              <svg
                className="mt-5 h-52 w-full overflow-visible"
                viewBox="0 0 620 190"
                role="img"
                aria-label={`Monthly booking activity: ${monthlyBookings.map((month) => `${month.label} ${month.count}`).join(", ")}`}
                preserveAspectRatio="none"
              >
                {[40, 103, 166].map((y) => (
                  <line
                    key={y}
                    x1="44"
                    x2="596"
                    y1={y}
                    y2={y}
                    stroke="#d5e0e7"
                    strokeDasharray={y === 166 ? undefined : "4 5"}
                  />
                ))}
                <text x="8" y="44" fill="#4d6470" fontSize="11">
                  {maxMonthlyBookings}
                </text>
                <text x="8" y="107" fill="#4d6470" fontSize="11">
                  {Math.ceil(maxMonthlyBookings / 2)}
                </text>
                <text x="8" y="170" fill="#4d6470" fontSize="11">0</text>
                <path d={bookingAreaPath} fill="#e5f2f7" />
                <path
                  d={bookingLinePath}
                  fill="none"
                  stroke="#00628b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {chartPoints.map((point) => (
                  <circle
                    key={point.label}
                    cx={point.x}
                    cy={point.y}
                    r="4.5"
                    fill="#ffffff"
                    stroke="#00628b"
                    strokeWidth="3"
                  >
                    <title>{`${point.label}: ${point.count} bookings`}</title>
                  </circle>
                ))}
              </svg>
              <div className="ml-11 mt-1 grid grid-cols-6 text-center text-xs font-medium text-muted">
                {monthlyBookings.map((month) => (
                  <span key={month.label}>{month.label}</span>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
              <div>
                <h3 className="font-display text-lg text-navy">Fleet availability</h3>
                <p className="mt-1 text-sm text-muted">Current truck status across the fleet</p>
              </div>
              <div
                className="mt-6 flex h-3 overflow-hidden rounded-full bg-line"
                role="img"
                aria-label={`${availableTrucks} available and ${trucks.length - availableTrucks} unavailable trucks`}
              >
                <span
                  className="bg-brand transition-all"
                  style={{ width: `${trucks.length ? (availableTrucks / trucks.length) * 100 : 0}%` }}
                />
                <span
                  className="bg-brand/25 transition-all"
                  style={{ width: `${trucks.length ? ((trucks.length - availableTrucks) / trucks.length) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-6 space-y-5">
                {[
                  { label: "Available", count: availableTrucks, color: "bg-brand" },
                  { label: "Unavailable", count: trucks.length - availableTrucks, color: "bg-brand/25" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium text-navy">
                        <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                        {item.label}
                      </span>
                      <span className="tabular-nums text-muted">{item.count} trucks</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                      <span
                        className={`block h-full rounded-full ${item.color}`}
                        style={{ width: `${trucks.length ? (item.count / trucks.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {!trucks.length ? (
                <p className="mt-5 text-sm text-muted">No trucks have been recorded yet.</p>
              ) : null}
            </article>

            <article className="min-w-0 rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg text-navy">Commission earned</h3>
                  <p className="mt-1 text-sm text-muted">Released booking commissions by month</p>
                </div>
                <span className="rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-dark">
                  {commission
                    ? `Total ${new Intl.NumberFormat("en-RW", { notation: "compact", maximumFractionDigits: 1 }).format(commission.totalEarnedRwf)} RWF`
                    : "Loading total"}
                </span>
              </div>
              <div
                className="mt-5 grid grid-cols-6 gap-2"
                role="img"
                aria-label={`Released commission by month: ${monthlyCommissions.map((month) => `${month.label} ${month.totalRwf} Rwandan francs`).join(", ")}`}
              >
                {monthlyCommissions.map((month) => {
                  const compactAmount = new Intl.NumberFormat("en-RW", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(month.totalRwf);
                  return (
                    <div key={month.label} className="flex min-w-0 flex-col items-center gap-2 text-center">
                      <span className="h-4 max-w-full truncate text-[10px] font-medium tabular-nums text-muted">
                        {compactAmount}
                      </span>
                      <div className="flex h-32 w-full items-end rounded-lg bg-background px-1.5">
                        <span
                          className="block w-full rounded-t-md bg-brand transition-all"
                          style={{ height: `${month.totalRwf ? Math.max(4, (month.totalRwf / maxMonthlyCommission) * 100) : 1}%` }}
                          title={`${month.label}: RWF ${month.totalRwf.toLocaleString("en-RW")}`}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted">{month.label}</span>
                    </div>
                  );
                })}
              </div>
              {!commission ? (
                <p className="mt-4 text-sm text-muted">
                  Loading commission history…
                </p>
              ) : !monthlyCommissions.some((month) => month.totalRwf > 0) ? (
                <p className="mt-4 text-sm text-muted">
                  No released commissions in the last six months.
                </p>
              ) : null}
            </article>

            <article className="min-w-0 rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
              <div>
                <h3 className="font-display text-lg text-navy">User registrations</h3>
                <p className="mt-1 text-sm text-muted">New accounts by role and month</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted">
                {registrationSeries.map((series) => (
                  <span key={series.key} className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                    {series.label}
                  </span>
                ))}
              </div>
              <svg
                className="mt-4 h-52 w-full overflow-visible"
                viewBox="0 0 620 190"
                role="img"
                aria-label={`Monthly registrations by role: ${monthlyUserRegistrations.map((month) => `${month.label}: ${month.IMPORTER} importers, ${month.TRUCK_OWNER} truck owners, ${month.ADMIN} admins`).join("; ")}`}
                preserveAspectRatio="none"
              >
                {[40, 103, 166].map((y) => (
                  <line
                    key={y}
                    x1="44"
                    x2="596"
                    y1={y}
                    y2={y}
                    stroke="#d5e0e7"
                    strokeDasharray={y === 166 ? undefined : "4 5"}
                  />
                ))}
                <text x="8" y="44" fill="#4d6470" fontSize="11">
                  {maxRegistrations}
                </text>
                <text x="8" y="107" fill="#4d6470" fontSize="11">
                  {Math.ceil(maxRegistrations / 2)}
                </text>
                <text x="8" y="170" fill="#4d6470" fontSize="11">0</text>
                {registrationLines.map((series) => (
                  <g key={series.key}>
                    <path
                      d={series.points
                        .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
                        .join(" ")}
                      fill="none"
                      stroke={series.color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {series.points.map((point) => (
                      <circle
                        key={`${series.key}-${point.label}`}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#ffffff"
                        stroke={series.color}
                        strokeWidth="3"
                      >
                        <title>{`${point.label}: ${point.value} ${series.label.toLowerCase()}`}</title>
                      </circle>
                    ))}
                  </g>
                ))}
              </svg>
              <div className="ml-11 mt-1 grid grid-cols-6 text-center text-xs font-medium text-muted">
                {monthlyUserRegistrations.map((month) => (
                  <span key={month.label}>{month.label}</span>
                ))}
              </div>
              {!users.length ? (
                <p className="mt-4 text-sm text-muted">
                  {userCountError
                    ? "User registration data could not be loaded."
                    : userCount === null
                      ? "Loading registration data…"
                      : "No user registrations have been recorded yet."}
                </p>
              ) : null}
            </article>

            <article className="min-w-0 rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
              <div>
                <h3 className="font-display text-lg text-navy">Bookings by status</h3>
                <p className="mt-1 text-sm text-muted">Where every freight request sits today</p>
              </div>
              <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
                <svg
                  className="h-44 w-44 shrink-0"
                  viewBox="0 0 140 140"
                  role="img"
                  aria-label={`Bookings by status: ${statusSlices.map((slice) => `${slice.label} ${slice.count}`).join(", ")}`}
                >
                  <circle cx="70" cy="70" r={donutRadius} fill="none" stroke="#eef4f7" strokeWidth="20" />
                  {donutSlices.map((slice) => (
                    <circle
                      key={slice.status}
                      cx="70"
                      cy="70"
                      r={donutRadius}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="20"
                      strokeDasharray={`${slice.dash} ${donutCircumference - slice.dash}`}
                      strokeDashoffset={-slice.offset}
                      transform="rotate(-90 70 70)"
                    >
                      <title>{`${slice.label}: ${slice.count}`}</title>
                    </circle>
                  ))}
                  <text x="70" y="66" textAnchor="middle" fill="#122832" fontSize="24" fontWeight="700">
                    {bookings.length}
                  </text>
                  <text x="70" y="84" textAnchor="middle" fill="#4d6470" fontSize="10">
                    bookings
                  </text>
                </svg>
                <ul className="w-full space-y-2.5">
                  {statusSlices.map((slice) => (
                    <li key={slice.status} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium text-navy">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                        {slice.label}
                      </span>
                      <span className="tabular-nums text-muted">{slice.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {!bookings.length ? (
                <p className="mt-4 text-sm text-muted">No bookings have been recorded yet.</p>
              ) : null}
            </article>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-xl tracking-tight text-navy">Generate a report</h2>
              <p className="mt-1 text-sm text-muted">
                Export current marketplace records as a spreadsheet-ready CSV.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="report-kind">Report type</label>
              <select
                id="report-kind"
                className="min-h-11 min-w-52 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm font-medium text-navy outline-none transition hover:border-brand/30 focus:border-brand focus:ring-2 focus:ring-brand/15"
                value={reportKind}
                onChange={(event) => setReportKind(event.target.value as ReportKind)}
              >
                <option value="overview">Marketplace summary</option>
                <option value="bookings">Booking report</option>
                <option value="trucks">Fleet report</option>
                <option value="users">User directory</option>
              </select>
              <GhostButton
                type="button"
                disabled={reportKind === "users" && (userCount === null || userCountError)}
                onClick={() => handleGenerateReport("csv")}
                className="min-h-11"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12m-5-5 5 5 5-5M4 17v3h16v-3" />
                </svg>
                Download CSV
              </GhostButton>
              <GhostButton
                type="button"
                disabled={reportKind === "users" && (userCount === null || userCountError)}
                onClick={() => handleGenerateReport("pdf")}
                className="min-h-11"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 3h7l5 5v13H7z" />
                  <path d="M14 3v5h5M10 14h6M10 17h6" />
                </svg>
                Download PDF
              </GhostButton>
            </div>
          </div>
          {reportKind === "users" && userCountError ? (
            <p role="alert" className="mt-3 text-sm text-bad">
              User data could not be loaded, so this report is unavailable.
            </p>
          ) : null}
        </section>
      </DashboardShell>
    </RequireAuth>
  );
}
