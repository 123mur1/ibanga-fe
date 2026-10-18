"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DataTable, PageHeader, formatDate } from "@/components/ui";
import { useIbanga } from "@/lib/store";

const formatRwf = (amount: number) =>
  `RWF ${amount.toLocaleString("en-RW", { maximumFractionDigits: 0 })}`;

export default function AdminWalletsPage() {
  const { walletAccounts, adminCommission } = useIbanga();
  const totalBalance = walletAccounts.reduce((sum, account) => sum + account.balance, 0);
  const transactions = walletAccounts.flatMap((account) =>
    account.transactions.map((entry) => ({ account, entry })),
  );

  return (
    <RequireAuth role="ADMIN">
      <DashboardShell role="ADMIN">
        <PageHeader
          eyebrow="Finance"
          title="Wallets"
          subtitle="Account balances, marketplace commission and wallet activity in one place."
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 9h18m-5 5h2" />
            </svg>
          }
        />

        <section className="mt-6 overflow-hidden rounded-2xl bg-linear-to-r from-brand via-brand to-brand-dark px-5 py-6 text-white shadow-card sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-white/75">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 9h18m-5 5h2" />
                </svg>
                Combined wallet balances
              </div>
              <p className="mt-2 font-display text-4xl tabular-nums">{formatRwf(totalBalance)}</p>
              <p className="mt-1 text-sm text-white/75">
                Across {walletAccounts.length} account{walletAccounts.length === 1 ? "" : "s"} · {transactions.length} transactions
              </p>
            </div>
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
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4">
            <h2 className="font-display text-xl text-navy">Wallet transactions</h2>
            <p className="mt-1 text-sm text-muted">Every deposit, payment, earning and withdrawal recorded.</p>
          </div>
          <DataTable
            columns={[{ label: "Date" }, { label: "Account" }, { label: "Type" }, { label: "Description" }, { label: "Reference" }, { label: "Amount" }, { label: "Status" }]}
            rows={transactions.map(({ account, entry }) => ({
              id: entry.id,
              searchText: `${account.name} ${account.email} ${entry.type} ${entry.description ?? ""} ${entry.reference} ${entry.status}`,
              filterValue: entry.type,
              exportValues: [
                formatDate(entry.createdAt),
                account.name,
                entry.type,
                entry.description ?? "",
                entry.reference,
                `${entry.direction === "DEBIT" ? "-" : "+"}${formatRwf(entry.amountRwf)}`,
                entry.status,
              ],
              cells: [
                formatDate(entry.createdAt),
                <span key={`${entry.id}-account`}>
                  <strong className="block">{account.name}</strong>
                  <span className="text-xs text-muted">{account.email}</span>
                </span>,
                entry.type.replaceAll("_", " "),
                entry.description ?? "—",
                entry.reference,
                <strong key={`${entry.id}-amount`} className={entry.direction === "DEBIT" ? "text-navy" : "text-brand"}>
                  {entry.direction === "DEBIT" ? "−" : "+"}{formatRwf(entry.amountRwf)}
                </strong>,
                entry.status,
              ],
            }))}
            filterLabel="All transaction types"
            emptyMessage="No wallet transactions have been recorded."
          />
        </section>
      </DashboardShell>
    </RequireAuth>
  );
}
