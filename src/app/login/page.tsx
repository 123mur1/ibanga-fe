"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { demoAccounts, demoEnabled } from "@/lib/demo";
import { dashboardPath, useIbanga } from "@/lib/store";
import type { Role } from "@/lib/types";

function getPostLoginPath(role: Role, requestedPath: string | null) {
  const roleHome = dashboardPath(role);
  if (requestedPath === roleHome || requestedPath?.startsWith(`${roleHome}/`)) {
    return requestedPath;
  }
  if (requestedPath === "/dashboard/wallet" || requestedPath === "/trucks") {
    return requestedPath;
  }
  if (role === "IMPORTER" && requestedPath && /^\/trucks\/[^/]+$/.test(requestedPath)) {
    return requestedPath;
  }
  if (role === "IMPORTER" && requestedPath === "/bookings/new") {
    return requestedPath;
  }
  return roleHome;
}

function LoginForm() {
  const { login, currentUser } = useIbanga();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (currentUser) {
      router.replace(getPostLoginPath(currentUser.role, params.get("next")));
    }
  }, [currentUser, params, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await login(email, password);
    setBusy(false);
    if (result.error || !result.user) {
      setError(result.error ?? "Could not sign in.");
      return;
    }
    router.push(
      getPostLoginPath(result.user.role, params.get("next")),
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-xl border border-line bg-card shadow-soft">
        <div className="border-b-4 border-brand px-8 pb-5 pt-8">
          <p className="text-sm font-semibold text-brand">iBanga</p>
          <h1 className="mt-1 text-2xl font-semibold text-navy">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage bookings, trucks, and payments.</p>
        </div>

        <div className="p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <Field label="Email">
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
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
            </Field>
            <Field label="Password">
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
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted transition hover:text-navy"
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

            <div className="flex items-center justify-between gap-3 pt-1 text-sm">
              <span className="flex items-center gap-2 text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Secure account sign-in
              </span>
              <Link href="/forgot-password" className="text-sm font-medium text-brand hover:text-brand-dark">
                Forgot password?
              </Link>
            </div>

            {demoEnabled ? (
              <section className="rounded-lg border border-line bg-background px-3 py-3">
                <p className="text-sm font-semibold text-navy">Demo accounts</p>
                <p className="mt-1 text-sm text-muted">Local data only. No server is required.</p>
                <ul className="mt-2 space-y-1.5 text-sm text-navy">
                  {demoAccounts.map((account) => (
                    <li key={account.email} className="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
                      <span className="font-medium">{account.role}</span>
                      <span className="text-muted">{account.email} · {account.password}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {error ? (
              <p className="flex items-center gap-2 rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                {error}
              </p>
            ) : null}

            <PrimaryButton className="w-full py-3" type="submit" disabled={busy}>
              {busy ? (
                <>
                  <svg
                    className="animate-spin"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Continue
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </PrimaryButton>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-medium text-muted">New to iBanga?</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <Link
            href="/register"
            className="mt-4 block w-full rounded-xl border border-brand/25 bg-brand-soft/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-dark transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand-soft"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell showImage={false}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
