"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { DataTable, PageHeader, StatCard, formatDate } from "@/components/ui";
import { useIbanga } from "@/lib/store";

const formatRwf = (amount: number) =>
  `RWF ${amount.toLocaleString("en-RW", { maximumFractionDigits: 0 })}`;

export default function AdminWalletsPage() {
  const { walletAccounts } = useIbanga();
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
          subtitle="Review account balances and wallet transaction history across the marketplace."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard label="Wallet accounts" value={walletAccounts.length} hint="All account roles" />
          <StatCard label="Combined balances" value={formatRwf(totalBalance)} hint="Current account balances" accent="good" />
          <StatCard label="Transactions" value={transactions.length} hint="Recorded wallet activity" accent="accent" />
        </div>

        <section className="mt-8">
          <h2 className="font-display text-xl text-navy">Account balances</h2>
          <div className="mt-4">
            <DataTable
              columns={[{ label: "Account" }, { label: "Role" }, { label: "Balance" }, { label: "Transactions" }]}
              rows={walletAccounts.map((account) => ({
                id: account.userId,
                searchText: `${account.name} ${account.email} ${account.role}`,
                filterValue: account.role,
                exportValues: [account.name, account.email, account.role, formatRwf(account.balance), String(account.transactions.length)],
                cells: [
                  <span key={`${account.userId}-account`}>
                    <strong className="block">{account.name}</strong>
                    <span className="text-xs text-muted">{account.email}</span>
                  </span>,
                  account.role.replaceAll("_", " "),
                  <strong key={`${account.userId}-balance`}>{formatRwf(account.balance)}</strong>,
                  account.transactions.length,
                ],
              }))}
              filterLabel="All roles"
              emptyMessage="No wallet accounts are available."
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl text-navy">Transaction history</h2>
          <div className="mt-4">
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
                  <strong key={`${entry.id}-amount`} className={entry.direction === "DEBIT" ? "text-bad" : "text-good"}>
                    {entry.direction === "DEBIT" ? "−" : "+"}{formatRwf(entry.amountRwf)}
                  </strong>,
                  entry.status,
                ],
              }))}
              filterLabel="All transaction types"
              emptyMessage="No wallet transactions have been recorded."
            />
          </div>
        </section>
      </DashboardShell>
    </RequireAuth>
  );
}
