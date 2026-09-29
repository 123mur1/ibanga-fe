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
  mode: "mock" | "flutterwave";
  transactions: WalletTransaction[];
};

type BankOption = { id?: string; code?: string; name?: string };
type BranchOption = { id?: string; code?: string; name?: string };

const formatRwf = (amount: number) =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);

export default function WalletPage() {
  const { currentUser } = useIbanga();
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [method, setMethod] = useState<"MOBILE_MONEY" | "BANK">("MOBILE_MONEY");
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
    if (!bankCode) {
      setBranches([]);
      setBranchCode("");
      return;
    }
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
      setNotice(
        wallet?.mode === "mock"
          ? "Local test withdrawal completed. No real money was sent."
          : "Withdrawal submitted. The reserved amount will return if the provider rejects it.",
      );
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

  return (
    <RequireAuth>
      <DashboardShell role={currentUser?.role ?? "IMPORTER"}>
        <PageHeader
          eyebrow="Money"
          title="Wallet"
          subtitle="Deposit Rwandan francs, pay for a booking, and withdraw available funds."
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 9h18m-5 5h2" />
            </svg>
          }
        />

        <section className="mt-5 flex flex-wrap items-end justify-between gap-4 border-y border-line py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              Available balance
            </p>
            <p className="mt-1 font-display text-3xl text-navy">
              {loading ? "Loading…" : formatRwf(wallet?.balanceRwf ?? 0)}
            </p>
          </div>
          <p className="max-w-md text-sm leading-5 text-muted">
            Booking payments are held until delivery confirmation. Owners receive the agreed price less the 6% iBanga commission.
          </p>
        </section>

        {wallet?.mode === "mock" ? (
          <p className="mt-4 rounded-lg border border-warn/20 bg-warn-soft px-4 py-3 text-sm text-warn">
            Local simulation: deposits and withdrawals change test balances only. No real money is charged or transferred.
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

        <div className="mt-5 grid gap-8 lg:grid-cols-2">
          <section className="border-b border-line pb-7 lg:border-b-0 lg:border-r lg:pr-8">
            <h2 className="font-display text-xl text-navy">Deposit</h2>
            <p className="mt-1 text-sm text-muted">Authorize the payment on your Rwanda mobile money account.</p>
            <form className="mt-5 space-y-4" onSubmit={deposit}>
              <Field label="Amount (RWF)">
                <input
                  className={inputClass}
                  type="number"
                  min="1000"
                  max="50000000"
                  step="1"
                  required
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(event.target.value)}
                  placeholder="50000"
                />
              </Field>
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
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting
                  ? "Starting deposit…"
                  : wallet?.mode === "mock"
                    ? "Simulate deposit"
                    : "Continue with MTN"}
              </PrimaryButton>
            </form>
          </section>

          <section className="pb-7">
            <h2 className="font-display text-xl text-navy">Withdraw</h2>
            <p className="mt-1 text-sm text-muted">Send available funds to a Rwanda bank account or MTN wallet.</p>
            <form className="mt-5 space-y-4" onSubmit={withdraw}>
              <Field label="Withdrawal method">
                <select
                  className={inputClass}
                  value={method}
                  onChange={(event) => setMethod(event.target.value as "MOBILE_MONEY" | "BANK")}
                >
                  <option value="MOBILE_MONEY">MTN Mobile Money</option>
                  <option value="BANK">Rwanda bank account</option>
                </select>
              </Field>
              <Field label="Amount (RWF)">
                <input
                  className={inputClass}
                  type="number"
                  min="1000"
                  max="50000000"
                  step="1"
                  required
                  value={withdrawAmount}
                  onChange={(event) => setWithdrawAmount(event.target.value)}
                  placeholder="50000"
                />
              </Field>
              <Field label="Beneficiary name">
                <input
                  className={inputClass}
                  required
                  value={beneficiaryName}
                  onChange={(event) => setBeneficiaryName(event.target.value)}
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
                  />
                </Field>
              ) : (
                <>
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
                  <Field label="Bank account number">
                    <input
                      className={inputClass}
                      required
                      value={accountNumber}
                      onChange={(event) => setAccountNumber(event.target.value)}
                    />
                  </Field>
                </>
              )}
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? "Submitting withdrawal…" : "Withdraw funds"}
              </PrimaryButton>
            </form>
          </section>
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