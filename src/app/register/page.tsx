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
    <div className="mx-auto w-full max-w-lg rounded-3xl border border-line bg-card p-8">
      <h1 className="font-display text-3xl text-navy">Create an account</h1>
      <p className="mt-2 text-sm text-muted">
        Register as an importer or a truck owner. Admin accounts are not
        self-serve.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-background p-1">
          <button
            type="button"
            onClick={() => setRole("IMPORTER")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              role === "IMPORTER" ? "bg-card text-navy shadow-sm" : "text-muted"
            }`}
          >
            Importer
          </button>
          <button
            type="button"
            onClick={() => setRole("TRUCK_OWNER")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              role === "TRUCK_OWNER" ? "bg-card text-navy shadow-sm" : "text-muted"
            }`}
          >
            Truck owner
          </button>
        </div>
        <Field label="Full name">
          <input
            className={inputClass}
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Company (optional)">
          <input
            className={inputClass}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <input
            className={inputClass}
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+250 …"
          />
        </Field>
        <Field label="Location">
          <input
            className={inputClass}
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Kigali"
          />
        </Field>
        <Field label="Password">
          <input
            className={inputClass}
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        {error ? <p className="text-sm text-bad">{error}</p> : null}
        <PrimaryButton className="w-full" type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Register"}
        </PrimaryButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell image="/photos/ibanga-semi.png">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
