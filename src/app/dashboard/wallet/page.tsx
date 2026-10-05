"use client";

import { FormEvent, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { RequireAuth } from "@/components/require-auth";
import { Field, inputClass, PageHeader, PrimaryButton } from "@/components/ui";
import { api } from "@/lib/api";
import { useIbanga } from "@/lib/store";
import type { WalletTransaction } from "@/lib/types";

type WalletResponse = {
  balanceRwf: number;
  currency: "RWF";
  mode: "mock";
  transactions: WalletTransaction[];
};

type BankOption = { id?: string; code?: string; name?: string };
type BranchOption = { id?: string; code?: string; name?: string };
type PaymentMode = "DEPOSIT" | "WITHDRAW";

const AMOUNT_PRESETS = [10000, 25000, 50000, 100000];

const formatRwf = (amount: number) =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);

export default function WalletPage() {
  const { currentUser } = useIbanga();
  const isAdmin = currentUser?.role === "ADMIN";
  const canDeposit = currentUser?.role === "IMPORTER";
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [method, setMethod] = useState<"MOBILE_MONEY" | "BANK">("MOBILE_MONEY");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("DEPOSIT");
  const [bankCode, setBankCode] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPhone, setDepositPhone] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<WalletResponse>("/wallet")
      .then((data) => {
        if (active) setWallet(data);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load the wallet.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (method !== "BANK") return;
    let active = true;
    api<BankOption[]>("/wallet/banks")
      .then((data) => {
        if (active) setBanks(data);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load Rwanda banks.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [method]);

  useEffect(() => {
    if (!bankCode) return;

    let active = true;
    api<BranchOption[]>(`/wallet/banks/${encodeURIComponent(bankCode)}/branches`)
      .then((data) => {
        if (active) setBranches(data);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load bank branches.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [bankCode]);

  async function refreshWallet() {
    setWallet(await api<WalletResponse>("/wallet"));
  }

  async function deposit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const result = await api<{ paymentUrl?: string; simulated?: boolean }>("/wallet/deposits", {
        method: "POST",
        body: JSON.stringify({
          amountRwf: Number(depositAmount),
          phoneNumber: depositPhone,
        }),
      });
      if (result.simulated) {
        await refreshWallet();
        setDepositAmount("");
        setNotice("Local test deposit added. No real money was charged.");
      } else if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not start the deposit.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function withdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await api("/wallet/withdrawals", {
        method: "POST",
        body: JSON.stringify({
          amountRwf: Number(withdrawAmount),
          method,
          beneficiaryName,
          ...(method === "MOBILE_MONEY"
            ? { phoneNumber: withdrawPhone }
            : { bankCode, branchCode, accountNumber }),
        }),
      });
      await refreshWallet();
      setWithdrawAmount("");
      setNotice("Simulated withdrawal completed. No real money was sent.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the withdrawal.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const bankValue = (bank: BankOption) => bank.code ?? bank.id ?? "";
  const branchValue = (branch: BranchOption) => branch.code ?? branch.id ?? "";
  const activePaymentMode: PaymentMode = canDeposit ? paymentMode : "WITHDRAW";
  const activeAmount = activePaymentMode === "DEPOSIT" ? depositAmount : withdrawAmount;
  const transferAmount = Number(activeAmount) || 0;
  const selectedBank = banks.find((bank) => bankValue(bank) === bankCode);

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
                {loading ? "Loading…" : formatRwf(wallet?.balanceRwf ?? 0)}
              </p>
            </div>
            <div className="max-w-sm border-l border-white/20 pl-5">
              <p className="text-sm font-semibold">
                {isAdmin
                  ? "Simulated platform withdrawals"
                  : canDeposit
                    ? "Simulated marketplace wallet"
                    : "Simulated wallet earnings"}
              </p>
              <p className="mt-1 text-sm leading-5 text-white/70">
                {isAdmin
                  ? "Test withdrawals update the wallet ledger only."
                  : canDeposit
                    ? "Deposits, booking payments, and withdrawals update test balances only. Owner earnings include the 6% iBanga commission."
                    : "Withdrawals update the wallet ledger only; no payout is sent."}
              </p>
            </div>
          </div>
        </section>

        {wallet?.mode === "mock" ? (
          <p className="mt-4 rounded-lg border border-warn/20 bg-warn-soft px-4 py-3 text-sm text-warn">
            {isAdmin
              ? "Simulation only: withdrawals update test balances. No real money is transferred."
              : canDeposit
                ? "Simulation only: deposits and withdrawals update test balances. No real money is charged or transferred."
                : "Simulation only: withdrawals update test balances. No real money is transferred."}
          </p>
        ) : null}

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

              {activePaymentMode === "DEPOSIT" ? (
                <Field label="MTN Mobile Money number">
                  <input
                    className={inputClass}
                    type="tel"
                    required
                    value={depositPhone}
                    onChange={(event) => setDepositPhone(event.target.value)}
                    placeholder="078 000 0000"
                  />
                </Field>
              ) : (
                <>
                  <fieldset>
                    <legend className="text-sm font-semibold text-navy">Send to</legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {([
                        { value: "MOBILE_MONEY", label: "MTN Mobile Money", detail: "Mobile wallet" },
                        { value: "BANK", label: "Bank account", detail: "Rwanda bank" },
                      ] as const).map((option) => (
                        <label
                          key={option.value}
                          className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition ${
                            method === option.value
                              ? "border-brand bg-brand-soft/60 ring-1 ring-brand/20"
                              : "border-line bg-white hover:border-brand/40"
                          }`}
                        >
                          <input
                            className="sr-only"
                            type="radio"
                            name="withdrawal-method"
                            value={option.value}
                            checked={method === option.value}
                            onChange={() => {
                              const nextMethod = option.value;
                              setMethod(nextMethod);
                              if (nextMethod !== "BANK") {
                                setBankCode("");
                                setBranchCode("");
                                setBranches([]);
                              }
                            }}
                          />
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            method === option.value ? "bg-white text-brand" : "bg-background text-muted"
                          }`}>
                            {option.value === "MOBILE_MONEY" ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="6" y="2.5" width="12" height="19" rx="2" />
                                <path d="M10 5.5h4M11 18.5h2" />
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="m3 9 9-6 9 6M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18M2 18h20" />
                              </svg>
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-navy">{option.label}</span>
                            <span className="mt-0.5 block text-xs text-muted">{option.detail}</span>
                          </span>
                          <span className={`ml-auto h-4 w-4 shrink-0 rounded-full border ${
                            method === option.value ? "border-[5px] border-brand" : "border-line"
                          }`} />
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <Field label="Beneficiary name">
                    <input
                      className={inputClass}
                      required
                      value={beneficiaryName}
                      onChange={(event) => setBeneficiaryName(event.target.value)}
                      autoComplete="name"
                    />
                  </Field>
                  {method === "MOBILE_MONEY" ? (
                    <Field label="MTN Mobile Money number">
                      <input
                        className={inputClass}
                        type="tel"
                        required
                        value={withdrawPhone}
                        onChange={(event) => setWithdrawPhone(event.target.value)}
                        placeholder="078 000 0000"
                        autoComplete="tel"
                      />
                    </Field>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Bank">
                        <select
                          className={inputClass}
                          required
                          value={bankCode}
                          onChange={(event) => {
                            setBankCode(event.target.value);
                            setBranchCode("");
                          }}
                        >
                          <option value="">Select bank</option>
                          {banks.map((bank) => (
                            <option key={bankValue(bank)} value={bankValue(bank)}>
                              {bank.name ?? bankValue(bank)}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Branch">
                        <select
                          className={inputClass}
                          required
                          disabled={!bankCode}
                          value={branchCode}
                          onChange={(event) => setBranchCode(event.target.value)}
                        >
                          <option value="">Select branch</option>
                          {branches.map((branch) => (
                            <option key={branchValue(branch)} value={branchValue(branch)}>
                              {branch.name ?? branchValue(branch)}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Bank account number">
                          <input
                            className={inputClass}
                            required
                            value={accountNumber}
                            onChange={(event) => setAccountNumber(event.target.value)}
                            autoComplete="off"
                          />
                        </Field>
                      </div>
                    </div>
                  )}
                </>
              )}

              <PrimaryButton type="submit" disabled={submitting} className="min-h-12 w-full justify-between px-5">
                <span>
                  {submitting
                    ? activePaymentMode === "DEPOSIT" ? "Starting deposit…" : "Submitting withdrawal…"
                    : activePaymentMode === "DEPOSIT"
                      ? wallet?.mode === "mock" ? "Simulate deposit" : "Continue with MTN"
                      : "Withdraw funds"}
                </span>
                {!submitting ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                ) : null}
              </PrimaryButton>
              <p className="text-center text-xs text-muted">
                {activePaymentMode === "DEPOSIT"
                  ? "Your wallet updates after the payment is confirmed."
                  : "The requested amount is reserved while the payout is processed."}
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
                    {activePaymentMode === "DEPOSIT" || method === "MOBILE_MONEY"
                      ? "MTN Mobile Money"
                      : "Rwanda bank account"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted">Destination</dt>
                  <dd className="max-w-48 wrap-break-word text-right font-medium text-navy">
                    {activePaymentMode === "DEPOSIT"
                      ? depositPhone || "Mobile Money number"
                      : method === "MOBILE_MONEY"
                        ? withdrawPhone || "Mobile Money number"
                        : selectedBank?.name ?? "Bank account"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-accent/20 bg-accent-soft/60 p-5 sm:p-6">
              <h3 className="font-display text-lg text-navy">What happens next</h3>
              <ol className="mt-4 space-y-3">
                {(activePaymentMode === "DEPOSIT"
                  ? [
                      "Enter your amount and MTN number.",
                      "Approve the payment with your mobile provider.",
                      "Your wallet updates after confirmation.",
                    ]
                  : [
                      "Choose a mobile wallet or bank account.",
                      "We reserve the amount while processing.",
                      "Follow the payout status in recent activity.",
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
              <p className="mt-1 text-sm text-muted">Latest wallet movements and their provider status.</p>
            </div>
            <button
              className="text-sm font-semibold text-brand hover:text-brand-dark"
              type="button"
              onClick={() => void refreshWallet().catch((refreshError) => setError(refreshError instanceof Error ? refreshError.message : "Could not refresh wallet."))}
            >
              Refresh
            </button>
          </div>
          <div className="mt-4 divide-y divide-line">
            {(wallet?.transactions ?? []).map((transaction) => (
              <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {transaction.description ?? transaction.type.replaceAll("_", " ")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(transaction.createdAt).toLocaleString("en-RW")}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${transaction.direction === "CREDIT" ? "text-good" : "text-navy"}`}>
                    {transaction.direction === "CREDIT" ? "+" : "−"}{formatRwf(transaction.amountRwf)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{transaction.status.toLowerCase()}</p>
                </div>
              </div>
            ))}
            {!loading && !wallet?.transactions.length ? (
              <p className="py-8 text-center text-sm text-muted">No wallet activity yet.</p>
            ) : null}
          </div>
        </section>
      </DashboardShell>
    </RequireAuth>
  );
}