import Link from "next/link";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
const VARIANT = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  ghost: "border border-line bg-white text-navy hover:border-brand/40 hover:bg-brand-soft/50",
} as const;

/** A link that looks like PrimaryButton / GhostButton (a button inside a link is invalid HTML). */
export function LinkButton({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: keyof typeof VARIANT }) {
  return (
    <Link href={href} className={`${BASE} ${VARIANT[variant]}`}>
      {children}
    </Link>
  );
}
