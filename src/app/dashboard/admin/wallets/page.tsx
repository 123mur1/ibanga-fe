"use client";

import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DataTable, PageHeader, StatCard, formatDate } from "@/components/ui";
import { useIbanga } from "@/lib/store";

const formatRwf = (amount: number) =>
  `RWF ${amount.toLocaleString("en-RW", { maximumFractionDigits: 0 })}`;

export default function AdminWalletsPage() {
  const {
    currentUser,
    walletBalance,
    transactions,
    commissionLoadError,
    commissionAvailableRwf,
    commissionTotalEarnedRwf,
  } = useIbanga();

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <PageHeader
          eyebrow="Finance"
          title="Wallets"
          subtitle="Review marketplace commission totals and your administrator wallet activity."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Available commission" value={commissionLoadError ? "—" : formatRwf(commissionAvailableRwf)} hint={commissionLoadError ?? "Marketplace commission balance"} accent="good" />
          <StatCard label="Commission earned" value={commissionLoadError ? "—" : formatRwf(commissionTotalEarnedRwf)} hint="Total marketplace commission" accent="accent" />
          <StatCard label="Your wallet" value={formatRwf(walletBalance)} hint="Administrator account balance" />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-card p-5 shadow-soft">
          <div>
            <h2 className="font-semibold text-navy">Withdraw available commission</h2>
            <p className="mt-1 text-sm text-muted">
              Choose a mobile-money or bank destination.
            </p>
          </div>
          <Link
            href="/dashboard/wallet"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-dark"
          >
            Go to withdrawals
          </Link>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-xl text-navy">Your wallet transactions</h2>
          <div className="mt-4">
            <DataTable
              columns={[{ label: "Date" }, { label: "Account" }, { label: "Type" }, { label: "Description" }, { label: "Reference" }, { label: "Amount" }, { label: "Status" }]}
              rows={transactions.map((entry) => ({
                id: entry.id,
                searchText: `${currentUser?.name ?? ""} ${currentUser?.email ?? ""} ${entry.type} ${entry.description ?? ""} ${entry.reference} ${entry.status}`,
                filterValue: entry.type,
                exportValues: [
                  formatDate(entry.createdAt), currentUser?.name ?? "", entry.type,
                  entry.description ?? "", entry.reference,
                  `${entry.direction === "DEBIT" ? "-" : "+"}${formatRwf(entry.amountRwf)}`, entry.status,
                ],
                cells: [
                  formatDate(entry.createdAt),
                  <span key={`${entry.id}-account`}>
                    <strong className="block">{currentUser?.name ?? "Administrator"}</strong>
                    <span className="text-xs text-muted">{currentUser?.email ?? ""}</span>
                  </span>,
                  entry.type.replaceAll("_", " "),
                  entry.description ?? "—",
                  entry.reference,
                  <strong key={`${entry.id}-amount`} className={entry.direction === "DEBIT" ? "text-bad" : "text-good"}>
                    {entry.direction === "DEBIT" ? "−" : "+"}{formatRwf(entry.amountRwf)}
                  </strong>,
                  entry.status,
                ],
              }))}
              filterLabel="All transaction types"
              emptyMessage="No transactions are recorded in your administrator wallet."
            />
          </div>
        </section>
      </DashboardShell>
    </RequireAuth>
  );
}
