"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";

function ResetPasswordForm() {
  const { resetPassword } = useIbanga();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError("This reset link is missing its token. Request a new link.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    const problem = await resetPassword(token, password);
    setBusy(false);
    if (problem) {
      setError(problem);
      return;
    }
    setComplete(true);
  }

  return (
    <section className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <div className="bg-brand px-7 py-8 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Account access</p>
        <h1 className="mt-2 font-display text-2xl">Password reset</h1>
        <p className="mt-2 text-sm text-white/80">Choose a new password for your account.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5 p-7">
        <Field label="New password">
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </Field>
        {error ? <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p> : null}
        {complete ? (
          <p role="status" className="rounded-lg bg-good-soft px-3 py-2 text-sm text-good">
            Password changed successfully. <Link href="/login" className="font-semibold underline">Sign in</Link>
          </p>
        ) : null}
        <PrimaryButton type="submit" disabled={busy || complete || !token} className="w-full justify-center">
          {busy ? "Updating…" : "Update password"}
        </PrimaryButton>
        <Link href="/forgot-password" className="block text-center text-sm font-semibold text-brand hover:text-brand-dark">
          Request a new reset link
        </Link>
      </form>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell image="/photos/ibanga-container-highway.png">
      <Suspense fallback={<p className="text-muted">Loading password reset…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
