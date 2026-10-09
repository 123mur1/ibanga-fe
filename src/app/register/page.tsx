"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass, PrimaryButton } from "@/components/ui";
import { dashboardPath, useIbanga } from "@/lib/store";
import type { Role } from "@/lib/types";

function RegisterForm() {
  const { register } = useIbanga();
  const router = useRouter();
  const params = useSearchParams();
  const preset = params.get("role") === "TRUCK_OWNER" ? "TRUCK_OWNER" : "IMPORTER";
  const [role, setRole] = useState<Exclude<Role, "ADMIN">>(preset);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    company: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await register({ ...form, role });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    router.push(dashboardPath(role));
  }

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-linear-to-tr from-accent/20 via-brand/15 to-transparent blur-2xl"
      />
      <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-card">
        <div className="relative h-40 overflow-hidden bg-linear-to-br from-accent via-brand to-navy">
          <div className="paper-grid absolute inset-0 opacity-40" />
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-14 h-44 w-44 rounded-full border-18 border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 left-16 h-40 w-40 rounded-full border-18 border-brand/40"
          />
          <div className="relative flex h-full items-center justify-center gap-4 px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-display text-xl text-white">Join the network</p>
              <p className="text-sm text-white/75">
                Importer or truck owner — connect directly
              </p>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/40 to-transparent" />
        </div>

        <div className="p-8">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-navy">
                I am a…
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("IMPORTER")}
                  className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    role === "IMPORTER"
                      ? "border-brand bg-brand-soft shadow-sm"
                      : "border-line bg-white hover:border-brand/30 hover:bg-brand-soft/50"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                      role === "IMPORTER"
                        ? "bg-brand text-white"
                        : "bg-background text-muted group-hover:text-brand"
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-navy">
                      Importer
                    </span>
                    <span className="block text-xs text-muted">
                      I ship cargo
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("TRUCK_OWNER")}
                  className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    role === "TRUCK_OWNER"
                      ? "border-brand bg-brand-soft shadow-sm"
                      : "border-line bg-white hover:border-brand/30 hover:bg-brand-soft/50"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                      role === "TRUCK_OWNER"
                        ? "bg-brand text-white"
                        : "bg-background text-muted group-hover:text-brand"
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M1 3h15v13H1z" />
                      <path d="M16 8h4l3 3v5h-7V8z" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-navy">
                      Truck owner
                    </span>
                    <span className="block text-xs text-muted">
                      I move cargo
                    </span>
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <Field label="Full name">
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
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    className={`${inputClass} pl-11`}
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </Field>
              <Field label="Company (optional)">
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
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
                    </svg>
                  </span>
                  <input
                    className={`${inputClass} pl-11`}
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
              </Field>
            </div>

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
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone">
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
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <input
                    className={`${inputClass} pl-11`}
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+250 …"
                  />
                </div>
              </Field>
              <Field label="Location">
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
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <input
                    className={`${inputClass} pl-11`}
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Kigali"
                  />
                </div>
              </Field>
            </div>

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
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                  Creating account…
                </>
              ) : (
                <>
                  Create my account
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
            <span className="text-xs font-medium text-muted">Already registered?</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <Link
            href="/login"
            className="mt-4 block w-full rounded-xl border border-brand/25 bg-brand-soft/60 px-4 py-2.5 text-center text-sm font-semibold text-brand-dark transition hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand-soft"
          >
            Log in instead
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell showImage={false}>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
