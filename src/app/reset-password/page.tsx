"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";

function ResetPasswordForm() {
  const { resetPassword } = useIbanga();
  const router = useRouter();
  const token = useSearchParams().get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!token) {
      setError("This reset link is missing its token. Request a new reset link.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const problem = await resetPassword(token, password);
      if (problem) {
        setError(problem);
      } else {
        setNotice("Your password has been reset. You can now sign in.");
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
          <h1 className="mt-2 font-display text-2xl">Password reset</h1>
          <p className="mt-2 text-sm text-white/80">Choose a new password for your account.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5 p-7">
          {!token ? (
            <p role="alert" className="rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
              This reset link is missing its token. Request a new reset link.
            </p>
          ) : null}
          <Field label="New password">
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <Field label="Confirm new password">
            <input
              className={inputClass}
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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
          {notice ? (
            <PrimaryButton
              type="button"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Go to sign in
            </PrimaryButton>
          ) : (
            <PrimaryButton type="submit" disabled={busy || !token} className="w-full">
              {busy ? "Resetting password…" : "Reset password"}
            </PrimaryButton>
          )}
          <Link href="/forgot-password" className="block text-center text-sm font-semibold text-brand hover:text-brand-dark">
            Request another reset link
          </Link>
          <Link href="/" className="block text-center text-sm font-semibold text-brand hover:text-brand-dark">
            Back to iBanga home
          </Link>
        </form>
      </section>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
