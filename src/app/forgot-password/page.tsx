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
    const result = await requestPasswordReset(email.trim());
    setBusy(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setNotice(result?.message || "If the account exists, password reset instructions will be sent.");
  }

  return (
    <AuthShell image="/photos/ibanga-container-highway.png">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="bg-brand px-7 py-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Account access</p>
          <h1 className="mt-2 font-display text-2xl">Password recovery</h1>
          <p className="mt-2 text-sm text-white/80">We’ll email a secure reset link if the account can be recovered.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5 p-7">
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          {error ? <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p> : null}
          {notice ? <p role="status" className="rounded-lg bg-good-soft px-3 py-2 text-sm text-good">{notice}</p> : null}
          <PrimaryButton type="submit" disabled={busy} className="w-full justify-center">
            {busy ? "Sending…" : "Send reset link"}
          </PrimaryButton>
          <Link
            href="/login"
            className="block text-center text-sm font-semibold text-brand hover:text-brand-dark"
          >
            Return to sign in
          </Link>
        </form>
      </section>
    </AuthShell>
  );
}
