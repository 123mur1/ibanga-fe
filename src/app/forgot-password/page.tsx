"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";

function ForgotPasswordForm() {
  const { requestPasswordReset } = useIbanga();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    const result = await requestPasswordReset(email);
    setBusy(false);

    if (!result || result.error) {
      setError(result?.error ?? "Could not request a password reset.");
      return;
    }

    setMessage(result.message);
  }

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-linear-to-tr from-brand/25 via-accent/15 to-transparent blur-2xl"
      />
      <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-card">
        <div className="relative h-32 overflow-hidden bg-linear-to-br from-brand via-brand-dark to-navy">
          <div className="paper-grid absolute inset-0 opacity-40" />
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-14 h-44 w-44 rounded-full border-18 border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-20 left-14 h-36 w-36 rounded-full border-18 border-accent/30"
          />
          <div className="relative flex h-full items-center justify-center gap-3 px-8 text-center text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 12h16" />
                <path d="M13 5l7 7-7 7" />
              </svg>
            </div>
            <div>
              <p className="font-display text-xl text-white">Reset access</p>
              <p className="text-sm text-white/75">We’ll send a secure reset link</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Email address">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
                <input
                  className={`${inputClass} pl-11`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
            </Field>

            {message ? (
              <p className="rounded-xl border border-good/20 bg-good-soft px-3.5 py-2.5 text-sm text-good">
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
                {error}
              </p>
            ) : null}

            <PrimaryButton className="w-full py-3" type="submit" disabled={busy}>
              {busy ? "Sending link…" : "Send reset link"}
            </PrimaryButton>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
            <span>Remembered your password?</span>
            <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell image="/photos/ibanga-container-highway.png">
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
