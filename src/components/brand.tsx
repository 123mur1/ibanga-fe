import Link from "next/link";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <rect width="36" height="36" rx="9" fill="#00628B" />
      <path
        d="M7 22h16l4-7H14"
        fill="none"
        stroke="#eef3fa"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="25.5" r="1.8" fill="#ffffff" />
      <circle cx="24" cy="25.5" r="1.8" fill="#ffffff" />
    </svg>
  );
}

export function BrandLink({
  href = "/",
  light = false,
}: {
  href?: string;
  light?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <LogoMark />
      <span
        className={`font-display text-xl tracking-tight ${
          light ? "text-white" : "text-navy"
        }`}
      >
        iBanga
      </span>
    </Link>
  );
}
