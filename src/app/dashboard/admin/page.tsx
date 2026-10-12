"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DataTable, GhostButton, PageHeader, StatCard, formatDate } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import type { Booking, BookingStatus, Role } from "@/lib/types";
import Link from "next/link";

const STATUS_FLOW: { status: BookingStatus; label: string; tone: string }[] = [
  { status: "PENDING", label: "Pending", tone: "bg-warn text-white" },
  { status: "ACCEPTED", label: "Accepted", tone: "bg-brand text-white" },
  { status: "IN_PROGRESS", label: "In progress", tone: "bg-accent text-white" },
  { status: "DELIVERED", label: "Delivered", tone: "bg-brand text-white" },
  { status: "COMPLETED", label: "Completed", tone: "bg-good text-white" },
  { status: "DISPUTED", label: "Disputed", tone: "bg-bad text-white" },
  { status: "REJECTED", label: "Rejected", tone: "bg-line text-muted" },
];

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

function getMonthlyCommissionTotals(bookings: Booking[]) {
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
      totalRwf: 0,
    };
  });

  for (const booking of bookings) {
    const payment = booking.payment;
    if (payment?.status !== "RELEASED" || !payment.releasedAt) continue;
    const releasedAt = new Date(payment.releasedAt);
    if (Number.isNaN(releasedAt.getTime())) continue;
    const monthIndex =
      (releasedAt.getUTCFullYear() - firstMonth.getUTCFullYear()) * 12 +
      releasedAt.getUTCMonth() -
      firstMonth.getUTCMonth();
    if (monthIndex >= 0 && monthIndex < months.length) {
      months[monthIndex].totalRwf += payment.commissionRwf;
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
  const { trucks, bookings, disputes, users: accountUsers, resetWorkspace } = useIbanga();
  const users: AdminReportUser[] = accountUsers.map((user) => ({
    ...user,
    phone: user.phone || null,
    location: user.location || null,
    company: user.company || null,
    createdAt: user.createdAt ?? new Date(0).toISOString(),
  }));
  const userCount = users.length;
  const [reportKind, setReportKind] = useState<ReportKind>("overview");
  const commission = bookings.reduce(
    (totals, booking) => {
      const payment = booking.payment;
      if (payment?.status === "FUNDED") totals.availableRwf += payment.commissionRwf;
      if (payment?.status === "RELEASED") totals.totalEarnedRwf += payment.commissionRwf;
      return totals;
    },
    { availableRwf: 0, totalEarnedRwf: 0 },
  );
  const userCountError = false;
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const openDisputes = disputes.filter((d) => d.status === "OPEN").length;
  const availableTrucks = trucks.filter((truck) => truck.status === "AVAILABLE").length;
  const monthlyBookings = getMonthlyBookingCounts(bookings);
  const maxMonthlyBookings = Math.max(1, ...monthlyBookings.map((month) => month.count));
  const monthlyCommissions = getMonthlyCommissionTotals(bookings);
  const maxMonthlyCommission = Math.max(
    1,
    ...monthlyCommissions.map((month) => month.totalRwf),
  );
  const monthlyUserRegistrations = getMonthlyUserRegistrations(users);
  const maxMonthlyRegistrations = Math.max(
    1,
    ...monthlyUserRegistrations.map(
      (month) => month.IMPORTER + month.TRUCK_OWNER + month.ADMIN,
    ),
  );
  const chartPoints = monthlyBookings.map((month, index) => ({
    ...month,
    x: 44 + (index * 552) / (monthlyBookings.length - 1),
    y: 166 - (month.count / maxMonthlyBookings) * 126,
  }));
  const bookingLinePath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const bookingAreaPath = `${bookingLinePath} L596,166 L44,166 Z`;

  async function handleReset() {
    if (!window.confirm("Restore marketplace records and balances to their initial values? This will discard current changes.")) return;
    setResetting(true);
    setResetError(null);
    const error = await resetWorkspace();
    if (error) setResetError(error);
    setResetting(false);
  }

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
      headStyles: { fillColor: [29, 42, 58], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 251] },
      didDrawPage: ({ pageNumber }) => {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
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
        <PageHeader
          eyebrow="Marketplace overview"
          title="Admin dashboard"
          subtitle="Keep the marketplace fair — users, trucks, bookings and disputes, all in one place."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
              <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
              <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
              <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
            </svg>
          }
          actions={
            <>
              <Link
                href="/dashboard/admin/disputes"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card"
              >
                Review disputes
                {openDisputes ? (
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-dark">
                    {openDisputes}
                  </span>
                ) : null}
              </Link>
              <GhostButton
                type="button"
                disabled={resetting}
                onClick={() => void handleReset()}
              >
                {resetting ? "Restoring…" : "Restore initial data"}
              </GhostButton>
            </>
          }
        />
        {resetError ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
            {resetError}
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Commission available"
            value={commission ? `RWF ${commission.availableRwf.toLocaleString("en-RW")}` : "—"}
            hint={commission ? `Earned RWF ${commission.totalEarnedRwf.toLocaleString("en-RW")}` : "Loading"}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2v20M17 5.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
            accent="good"
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
          />
          <StatCard
            label="Trucks"
            value={trucks.length}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
                <circle cx="7.5" cy="17.5" r="1.8" />
                <circle cx="17.5" cy="17.5" r="1.8" />
              </svg>
            }
            accent="accent"
          />
          <StatCard
            label="Bookings"
            value={bookings.length}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2.5" />
                <path d="M3 9.5h18M8 3v4m8-4v4" />
              </svg>
            }
            accent="good"
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
            accent="bad"
          />
        </div>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="font-display text-xl text-navy">Booking register</h2>
            <p className="mt-1 text-sm text-muted">Filter, select, and export marketplace booking records.</p>
          </div>
          <DataTable
            columns={[{ label: "Route" }, { label: "Importer" }, { label: "Truck" }, { label: "Created" }, { label: "Cargo" }, { label: "Status" }]}
            filterLabel="All booking statuses"
            rows={bookings.map((booking) => {
              const truck = trucks.find((item) => item.id === booking.truckId);
              const importer = users.find((user) => user.id === booking.importerId);
              const route = `${booking.pickupLocation} to ${booking.destination}`;
              return {
                id: booking.id,
                searchText: `${route} ${importer?.name ?? ""} ${truck?.plateNumber ?? ""} ${booking.cargoType}`,
                filterValue: booking.status,
                exportValues: [route, importer?.name ?? "", truck?.plateNumber ?? "", formatDate(booking.createdAt), booking.cargoType, booking.status],
                cells: [
                  <span key={`${booking.id}-route`} className="font-semibold">{route}</span>,
                  importer?.name ?? "—",
                  truck?.plateNumber ?? "—",
                  formatDate(booking.createdAt),
                  `${booking.cargoType} · ${booking.cargoWeight}`,
                  <span key={`${booking.id}-status`} className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-dark">{booking.status.replace("_", " ")}</span>,
                ],
              };
            })}
          />
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-navy">Marketplace analytics</h2>
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
                    stroke="#e4e9f0"
                    strokeDasharray={y === 166 ? undefined : "4 5"}
                  />
                ))}
                <text x="8" y="44" fill="#64748b" fontSize="11">
                  {maxMonthlyBookings}
                </text>
                <text x="8" y="107" fill="#64748b" fontSize="11">
                  {Math.ceil(maxMonthlyBookings / 2)}
                </text>
                <text x="8" y="170" fill="#64748b" fontSize="11">0</text>
                <path d={bookingAreaPath} fill="#eef0ff" />
                <path
                  d={bookingLinePath}
                  fill="none"
                  stroke="#4f46e5"
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
                    stroke="#4f46e5"
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
                  className="bg-accent transition-all"
                  style={{ width: `${trucks.length ? (availableTrucks / trucks.length) * 100 : 0}%` }}
                />
                <span
                  className="bg-navy-soft transition-all"
                  style={{ width: `${trucks.length ? ((trucks.length - availableTrucks) / trucks.length) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-6 space-y-5">
                {[
                  { label: "Available", count: availableTrucks, color: "bg-accent" },
                  { label: "Unavailable", count: trucks.length - availableTrucks, color: "bg-navy-soft" },
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
                <span className="rounded-lg bg-good-soft px-3 py-1.5 text-xs font-semibold text-good">
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
                          className="block w-full rounded-t-md bg-accent transition-all"
                          style={{ height: `${month.totalRwf ? Math.max(4, (month.totalRwf / maxMonthlyCommission) * 100) : 1}%` }}
                          title={`${month.label}: RWF ${month.totalRwf.toLocaleString("en-RW")}`}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted">{month.label}</span>
                    </div>
                  );
                })}
              </div>
              {!monthlyCommissions.some((month) => month.totalRwf > 0) ? (
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
                {[
                  { role: "IMPORTER", label: "Importers", color: "bg-brand" },
                  { role: "TRUCK_OWNER", label: "Truck owners", color: "bg-accent" },
                  { role: "ADMIN", label: "Admins", color: "bg-warn" },
                ].map((item) => (
                  <span key={item.role} className="inline-flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                    {item.label}
                  </span>
                ))}
              </div>
              <div
                className="mt-4 grid grid-cols-6 gap-2"
                role="img"
                aria-label={`Monthly registrations by role: ${monthlyUserRegistrations.map((month) => `${month.label}: ${month.IMPORTER} importers, ${month.TRUCK_OWNER} truck owners, ${month.ADMIN} admins`).join("; ")}`}
              >
                {monthlyUserRegistrations.map((month) => {
                  const total = month.IMPORTER + month.TRUCK_OWNER + month.ADMIN;
                  const roles = [
                    { role: "Importer", count: month.IMPORTER, color: "bg-brand" },
                    { role: "Truck owner", count: month.TRUCK_OWNER, color: "bg-accent" },
                    { role: "Admin", count: month.ADMIN, color: "bg-warn" },
                  ];
                  return (
                    <div key={month.label} className="flex min-w-0 flex-col items-center gap-2 text-center">
                      <span className="h-4 text-xs font-semibold tabular-nums text-navy">{total}</span>
                      <div className="flex h-32 w-full flex-col justify-end overflow-hidden rounded-lg bg-background px-1.5">
                        {roles.map((item) => (
                          <span
                            key={item.role}
                            className={`block w-full ${item.color}`}
                            style={{ height: `${item.count ? (item.count / maxMonthlyRegistrations) * 100 : 0}%` }}
                            title={`${month.label}: ${item.count} ${item.role.toLowerCase()} registrations`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-muted">{month.label}</span>
                    </div>
                  );
                })}
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
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-xl text-navy">Generate a report</h2>
              <p className="mt-1 text-sm text-muted">
                Export current marketplace records as a spreadsheet-ready CSV.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="report-kind">Report type</label>
              <select
                id="report-kind"
                className="min-h-11 min-w-52 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-medium text-navy shadow-soft outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
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

        <div className="mt-10">
          <h2 className="font-display text-xl tracking-tight text-navy">
            Bookings by status
          </h2>
          <p className="mt-1 text-sm text-muted">
            Where every freight request currently sits in its journey.
          </p>

          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-line">
            {STATUS_FLOW.map((step) => {
              const count = bookings.filter((b) => b.status === step.status).length;
              if (!count) return null;
              return (
                <div
                  key={step.status}
                  className={`${step.tone} transition-all`}
                  style={{ width: `${Math.round((count / (bookings.length || 1)) * 100)}%` }}
                  title={`${step.label}: ${count}`}
                />
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_FLOW.map((step) => {
              const count = bookings.filter((b) => b.status === step.status).length;
              return (
                <div
                  key={step.status}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 shadow-soft"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-muted">
                    <span className={`h-2 w-2 rounded-full ${step.tone}`} />
                    {step.label}
                  </span>
                  <span
                    className={`inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-sm font-semibold ${
                      count === 0 ? "bg-line text-muted" : "bg-brand-soft text-brand-dark"
                    }`}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </DashboardShell>
    </RequireAuth>
  );
}