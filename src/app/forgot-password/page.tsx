"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useIbanga();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const result = await requestPasswordReset(email.trim());
      if (!result) {
        setError("Could not request a password reset.");
      } else if (result.error) {
        setError(result.error);
      } else {
        setNotice(result.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell image="/photos/ibanga-container-highway.png">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="bg-brand px-7 py-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Account access</p>
          <h1 className="mt-2 font-display text-2xl">Password recovery</h1>
          <p className="mt-2 text-sm text-white/80">Enter your account email and we’ll send a reset link if it’s registered.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5 p-7">
          <Field label="Email address">
            <input
              className={inputClass}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
          </Field>
          {error ? (
            <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="rounded-lg border border-good/20 bg-good-soft px-4 py-3 text-sm text-good">
              {notice}
            </p>
          ) : null}
          <PrimaryButton type="submit" disabled={busy} className="w-full">
            {busy ? "Sending reset link…" : "Send reset link"}
          </PrimaryButton>
          <Link href="/login" className="block text-center text-sm font-semibold text-brand hover:text-brand-dark">
            Return to sign in
          </Link>
          <Link href="/" className="block text-center text-sm font-semibold text-brand hover:text-brand-dark">
            Back to iBanga home
          </Link>
        </form>
      </section>
    </AuthShell>
  );
}
