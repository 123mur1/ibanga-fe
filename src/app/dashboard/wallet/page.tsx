"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DataTable, PageHeader } from "@/components/ui";
import { useIbanga } from "@/lib/store";

const formatRwf = (amount: number) =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);

export default function WalletPage() {
  const { currentUser, walletBalance, transactions, adminCommission } = useIbanga();
  const isAdmin = currentUser?.role === "ADMIN";
  const canDeposit = currentUser?.role === "IMPORTER";

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <PageHeader
          eyebrow="Money"
          title="Wallet"
          subtitle={isAdmin
            ? "Platform balances, commission earned and every wallet transaction."
            : canDeposit
              ? "Your balance, deposits and payments in one ledger."
              : "Your earnings and withdrawals in one ledger."}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 9h18m-5 5h2" />
            </svg>
          }
        />

        <section className="mt-6 overflow-hidden rounded-2xl bg-linear-to-r from-brand via-brand to-brand-dark px-5 py-6 text-white shadow-card sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-white/75">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 9h18m-5 5h2" />
                </svg>
                Available balance
              </div>
              <p className="mt-2 font-display text-4xl tabular-nums">{formatRwf(walletBalance)}</p>
              <p className="mt-1 text-sm text-white/70">
                {isAdmin
                  ? "Platform wallet"
                  : canDeposit
                    ? "Marketplace wallet"
                    : "Wallet earnings"}
              </p>
            </div>

            {isAdmin ? (
              <div className="grid min-w-56 gap-4 border-white/20 sm:grid-flow-col sm:divide-x sm:divide-white/20">
                <div className="sm:px-6">
                  <p className="text-sm font-medium text-white/75">Commission fees earned</p>
                  <p className="mt-1 font-display text-2xl tabular-nums">
                    {adminCommission ? formatRwf(adminCommission.totalEarnedRwf) : "—"}
                  </p>
                  <p className="mt-1 text-xs text-white/60">6% platform share, all time</p>
                </div>
                <div className="sm:pl-6">
                  <p className="text-sm font-medium text-white/75">Commission available</p>
                  <p className="mt-1 font-display text-2xl tabular-nums">
                    {adminCommission ? formatRwf(adminCommission.availableRwf) : "—"}
                  </p>
                  <p className="mt-1 text-xs text-white/60">Currently held</p>
                </div>
              </div>
            ) : (
              <div className="max-w-sm border-l border-white/20 pl-5">
                <p className="text-sm font-semibold">Wallet ledger</p>
                <p className="mt-1 text-sm leading-5 text-white/70">
                  Every deposit, booking payment, earning and withdrawal is recorded below.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4">
            <h2 className="font-display text-xl text-navy">Transactions</h2>
            <p className="mt-1 text-sm text-muted">All wallet activity for this account.</p>
          </div>
          <DataTable
            columns={[{ label: "Description" }, { label: "Reference" }, { label: "Date" }, { label: "Direction" }, { label: "Amount" }, { label: "Status" }]}
            filterLabel="All transaction types"
            rows={transactions.map((transaction) => ({
              id: transaction.id,
              searchText: `${transaction.description ?? ""} ${transaction.reference ?? ""} ${transaction.type}`,
              filterValue: transaction.type,
              exportValues: [transaction.description ?? transaction.type.replaceAll("_", " "), transaction.reference ?? "", new Date(transaction.createdAt).toLocaleDateString("en-RW"), transaction.direction, formatRwf(transaction.amountRwf), transaction.status],
              cells: [
                transaction.description ?? transaction.type.replaceAll("_", " "),
                transaction.reference ?? "—",
                new Date(transaction.createdAt).toLocaleDateString("en-RW"),
                transaction.direction,
                <span key={`${transaction.id}-amount`} className={`font-semibold ${transaction.direction === "CREDIT" ? "text-brand" : "text-navy"}`}>{transaction.direction === "CREDIT" ? "+" : "−"}{formatRwf(transaction.amountRwf)}</span>,
                transaction.status.toLowerCase(),
              ],
            }))}
            emptyMessage="No wallet transactions have been recorded."
          />
        </section>
      </DashboardShell>
    </RequireAuth>
  );
}
