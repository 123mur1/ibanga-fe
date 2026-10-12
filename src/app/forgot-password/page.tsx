import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell image="/photos/ibanga-container-highway.png">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-card">
        <div className="bg-brand px-7 py-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Account access</p>
          <h1 className="mt-2 font-display text-2xl">Password recovery</h1>
          <p className="mt-2 text-sm text-white/80">Email recovery is not available yet.</p>
        </div>
        <div className="space-y-5 p-7">
          <div className="rounded-2xl border border-brand/15 bg-brand-soft/60 p-4">
            <p className="text-sm font-semibold text-navy">Need help signing in?</p>
            <p className="mt-1 text-sm text-muted">
              Contact the support team to get help recovering access to your account.
            </p>
          </div>
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Return to sign in
          </Link>
          <Link href="/" className="block text-center text-sm font-semibold text-brand hover:text-brand-dark">
            Back to iBanga home
          </Link>
        </div>
      </section>
    </AuthShell>
  );
}
