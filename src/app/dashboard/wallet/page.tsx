"use client";

import { FormEvent, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { useToast } from "@/components/toast";
import { DataTable, Field, inputClass, PageHeader, PrimaryButton, StatCard } from "@/components/ui";
import { useIbanga } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";
type PaymentMode = "DEPOSIT" | "WITHDRAW";

const AMOUNT_PRESETS = [10000, 25000, 50000, 100000];
const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "VISA", label: "Visa card" },
  { value: "AIRTEL", label: "Airtel Money" },
  { value: "MTN", label: "MTN MoMo" },
];

const formatRwf = (amount: number) =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);

export default function WalletPage() {
  const { currentUser, walletBalance, transactions, depositFunds, withdrawFunds } = useIbanga();
  const isAdmin = currentUser?.role === "ADMIN";
  const canDeposit = currentUser?.role === "IMPORTER";
  const [method, setMethod] = useState<PaymentMethod>("MTN");
  const toast = useToast();
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("DEPOSIT");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPhone, setDepositPhone] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function deposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    const problem = depositFunds(Number(depositAmount));
    if (problem) setError(problem);
    else {
      setDepositAmount("");
      setNotice("Wallet updated through your selected Visa, Airtel, or MTN account.");
      toast("Wallet updated.", "good");
    }
    setSubmitting(false);
  }

  async function withdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    const problem = withdrawFunds(Number(withdrawAmount));
    if (problem) setError(problem);
    else {
      setWithdrawAmount("");
      setNotice("Withdrawal recorded to your Visa, Airtel, or MTN account.");
      toast("Withdrawal recorded.", "good");
    }
    setSubmitting(false);
  }

  const activePaymentMode: PaymentMode = canDeposit ? paymentMode : "WITHDRAW";
  const activeAmount = activePaymentMode === "DEPOSIT" ? depositAmount : withdrawAmount;
  const transferAmount = Number(activeAmount) || 0;

  return (
    <RequireAuth>
      <DashboardShell role={currentUser?.role ?? "IMPORTER"}>
        <PageHeader
          eyebrow="Money"
          title="Wallet"
          subtitle={isAdmin
            ? "Withdraw available funds and review wallet activity."
            : canDeposit
              ? "Deposit Rwandan francs, pay for a booking, and withdraw available funds."
              : "Withdraw your available earnings to a mobile wallet or bank account."}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 9h18m-5 5h2" />
            </svg>
          }
        />

        <section className="mt-6 overflow-hidden rounded-2xl bg-linear-to-r from-navy via-navy to-accent-dark px-5 py-6 text-white shadow-card sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-white/75">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 9h18m-5 5h2" />
                </svg>
                Available balance
              </div>
              <p className="mt-2 font-display text-4xl tabular-nums">
                {formatRwf(walletBalance)}
              </p>
            </div>
            <div className="max-w-sm border-l border-white/20 pl-5">
              <p className="text-sm font-semibold">
                {isAdmin
                  ? "Platform wallet"
                  : canDeposit
                    ? "Marketplace wallet"
                    : "Wallet earnings"}
              </p>
              <p className="mt-1 text-sm leading-5 text-white/70">
                {isAdmin
                  ? "Transactions update the recorded balance only."
                  : canDeposit
                    ? "Deposits, booking payments, and withdrawals update recorded balances only. Owner earnings include the 6% iBanga commission."
                    : "Withdrawals update the recorded balance only; no payout is sent."}
              </p>
            </div>
          </div>
        </section>

        <p className="mt-4 rounded-lg border border-brand/15 bg-brand-soft px-4 py-3 text-sm text-brand-dark">
          {isAdmin
            ? "Wallet activity is recorded here. No real money is transferred."
            : canDeposit
              ? "Wallet deposits and withdrawals update recorded balances only. No real money is charged or transferred."
              : "Wallet withdrawals update the recorded balance only. No real money is transferred."}
        </p>

        {error ? (
          <p role="alert" className="mt-4 rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="mt-4 rounded-lg border border-good/20 bg-good-soft px-4 py-3 text-sm text-good">
            {notice}
          </p>
        ) : null}

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
          <section className="rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-brand">
                  {activePaymentMode === "DEPOSIT" ? "Add funds" : "Payout"}
                </p>
                <h2 className="mt-1 font-display text-2xl text-navy">
                  {activePaymentMode === "DEPOSIT" ? "Top up your wallet" : "Withdraw funds"}
                </h2>
                <p className="mt-1.5 max-w-lg text-sm leading-5 text-muted">
                  {activePaymentMode === "DEPOSIT"
                    ? "Choose an amount and enter a test mobile number. No external payment request is sent."
                    : "Choose an amount and enter test payout details. No money will be sent."}
                </p>
              </div>
              {canDeposit ? (
                <div className="inline-flex shrink-0 rounded-xl bg-background p-1" aria-label="Wallet action">
                  <button
                    type="button"
                    aria-pressed={activePaymentMode === "DEPOSIT"}
                    onClick={() => setPaymentMode("DEPOSIT")}
                    className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                      activePaymentMode === "DEPOSIT"
                        ? "bg-white text-navy shadow-soft"
                        : "text-muted hover:text-navy"
                    }`}
                  >
                    Add funds
                  </button>
                  <button
                    type="button"
                    aria-pressed={activePaymentMode === "WITHDRAW"}
                    onClick={() => setPaymentMode("WITHDRAW")}
                    className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                      activePaymentMode === "WITHDRAW"
                        ? "bg-white text-navy shadow-soft"
                        : "text-muted hover:text-navy"
                    }`}
                  >
                    Withdraw
                  </button>
                </div>
              ) : null}
            </div>

            <form
              className="mt-6 space-y-5"
              onSubmit={activePaymentMode === "DEPOSIT" ? deposit : withdraw}
            >
              <div>
                <div className="flex items-end justify-between gap-3">
                  <label htmlFor="transfer-amount" className="text-sm font-semibold text-navy">
                    Choose an amount
                  </label>
                  <span className="text-xs text-muted">RWF 1,000 to 50,000,000</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {AMOUNT_PRESETS.map((amount) => {
                    const amountValue = String(amount);
                    const selected = activeAmount === amountValue;
                    return (
                      <button
                        key={amount}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => activePaymentMode === "DEPOSIT"
                          ? setDepositAmount(amountValue)
                          : setWithdrawAmount(amountValue)}
                        className={`min-h-10 rounded-lg border px-2 text-sm font-semibold tabular-nums transition ${
                          selected
                            ? "border-brand bg-brand-soft text-brand-dark"
                            : "border-line bg-white text-navy hover:border-brand/40 hover:bg-background"
                        }`}
                      >
                        {amount.toLocaleString("en-RW")}
                      </button>
                    );
                  })}
                </div>
                <div className="relative mt-3">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-muted">
                    RWF
                  </span>
                  <input
                    id="transfer-amount"
                    className={`${inputClass} h-14 pl-16 text-xl font-semibold tabular-nums`}
                    type="number"
                    min="1000"
                    max="50000000"
                    step="1"
                    required
                    value={activeAmount}
                    onChange={(event) => activePaymentMode === "DEPOSIT"
                      ? setDepositAmount(event.target.value)
                      : setWithdrawAmount(event.target.value)}
                    placeholder="50000"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="text-sm font-semibold text-navy">Payment method</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {paymentMethods.map((option) => (
                    <label key={option.value} className={`cursor-pointer rounded-xl border px-3 py-3 text-sm font-semibold ${method === option.value ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-navy"}`}>
                      <input className="sr-only" type="radio" name="wallet-method" value={option.value} checked={method === option.value} onChange={() => setMethod(option.value)} />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              {activePaymentMode === "WITHDRAW" ? (
                <Field label="Beneficiary name">
                  <input className={inputClass} required value={beneficiaryName} onChange={(event) => setBeneficiaryName(event.target.value)} autoComplete="name" />
                </Field>
              ) : null}
              <Field label={method === "VISA" ? "Visa card number" : method === "AIRTEL" ? "Airtel Money number" : "MTN MoMo number"}>
                <input
                  className={inputClass}
                  required
                  value={activePaymentMode === "DEPOSIT" ? depositPhone : withdrawPhone}
                  onChange={(event) => activePaymentMode === "DEPOSIT" ? setDepositPhone(event.target.value) : setWithdrawPhone(event.target.value)}
                  placeholder={method === "VISA" ? "Card number" : "07X XXX XXXX"}
                />
              </Field>

              <PrimaryButton type="submit" disabled={submitting} className="min-h-12 w-full justify-between px-5">
                <span>
                  {submitting
                    ? activePaymentMode === "DEPOSIT" ? "Starting deposit…" : "Submitting withdrawal…"
                    : activePaymentMode === "DEPOSIT"
                      ? "Add funds"
                      : "Withdraw funds"}
                </span>
                {!submitting ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                ) : null}
              </PrimaryButton>
              <p className="text-center text-sm text-muted">
                Wallet movement uses Visa, Airtel Money, or MTN MoMo only.
              </p>
            </form>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 6h16v13H4zM4 10h16M8 15h3" />
                    <path d="M7 6V4h10v2" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-display text-lg text-navy">Transfer summary</h3>
                  <p className="text-xs text-muted">Review your details</p>
                </div>
              </div>
              <div className="mt-5 border-t border-line pt-4">
                <p className="text-sm text-muted">{activePaymentMode === "DEPOSIT" ? "Amount to add" : "Amount to withdraw"}</p>
                <p className="mt-1 font-display text-2xl tabular-nums text-navy">
                  {transferAmount ? formatRwf(transferAmount) : "Enter amount"}
                </p>
              </div>
              <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted">Method</dt>
                  <dd className="text-right font-medium text-navy">
                    {paymentMethods.find((option) => option.value === method)?.label}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted">Destination</dt>
                  <dd className="max-w-48 wrap-break-word text-right font-medium text-navy">
                    {(activePaymentMode === "DEPOSIT" ? depositPhone : withdrawPhone) || "Account number"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-accent/20 bg-accent-soft/60 p-5 sm:p-6">
              <h3 className="font-display text-lg text-navy">What happens next</h3>
              <ol className="mt-4 space-y-3">
                {(activePaymentMode === "DEPOSIT"
                  ? [
                      "Choose Visa, Airtel Money, or MTN MoMo.",
                      "Submit to add funds to this wallet.",
                      "Review the updated balance and activity.",
                    ]
                  : [
                      "Choose Visa, Airtel Money, or MTN MoMo.",
                      "Submit to deduct the amount from this wallet.",
                      "Review the transaction in recent activity.",
                    ]).map((step, index) => (
                  <li key={step} className="flex items-start gap-3 text-sm leading-5 text-navy/80">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-accent-dark ring-1 ring-accent/15">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>

        <section className="mt-2 border-t border-line pt-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl text-navy">Recent activity</h2>
              <p className="mt-1 text-sm text-muted">Recent sample transactions for this account.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <StatCard label="Available balance" value={formatRwf(walletBalance)} hint="Recorded balance" />
            <StatCard label="Transactions" value={transactions.length} hint="Account activity" accent="accent" />
            <StatCard label="Credits" value={formatRwf(transactions.filter((item) => item.direction === "CREDIT").reduce((total, item) => total + item.amountRwf, 0))} hint="Total received" accent="good" />
          </div>
          <div className="mt-4">
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
                  <span key={`${transaction.id}-amount`} className={`font-semibold ${transaction.direction === "CREDIT" ? "text-good" : "text-navy"}`}>{transaction.direction === "CREDIT" ? "+" : "−"}{formatRwf(transaction.amountRwf)}</span>,
                  transaction.status.toLowerCase(),
                ],
              }))}
            />
          </div>
        </section>
      </DashboardShell>
    </RequireAuth>
  );
}