"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { useIbanga } from "@/lib/store";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { resetPassword } = useIbanga();

  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!token.trim()) {
      setError("A reset token is required.");
      return;
    }

    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    const result = await resetPassword(token, password);
    setBusy(false);

    if (result) {
      setError(result);
      return;
    }

    setMessage("Your password has been reset. Redirecting you to sign in...");
    window.setTimeout(() => router.push("/login"), 1200);
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
            className="absolute -bottom-20 left-16 h-36 w-36 rounded-full border-18 border-accent/30"
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
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>
            <div>
              <p className="font-display text-xl text-white">Set a new password</p>
              <p className="text-sm text-white/75">Choose a strong secure password</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Reset token">
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
                    <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 1 0-7.07-7.07L10.6 5.6" />
                    <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07l2.83-2.83" />
                  </svg>
                </span>
                <input
                  className={`${inputClass} pl-11`}
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your reset token"
                  required
                />
              </div>
            </Field>

            <Field label="New password">
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
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
                <input
                  className={`${inputClass} pl-11 pr-11`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted transition hover:text-navy"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
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
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <path d="m1 1 22 22" />
                    </svg>
                  ) : (
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
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </Field>

            <Field label="Confirm new password">
              <input
                className={inputClass}
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
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
              {busy ? "Updating password…" : "Set new password"}
            </PrimaryButton>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
            <span>Need another reset link?</span>
            <Link href="/forgot-password" className="font-semibold text-brand hover:text-brand-dark">
              Request again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell image="/photos/ibanga-container-highway.png">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
