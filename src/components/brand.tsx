import Link from "next/link";

/**
 * A cargo truck on the road with a location pin over its load: freight that is booked, moved
 * and tracked. Keep `src/app/icon.svg` (the browser tab icon) in step with this drawing.
 */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <rect width="36" height="36" rx="9" fill="#00628B" />
      <path d="M8 9.5a3 3 0 0 1 6 0c0 2.2-3 4.6-3 4.6s-3-2.4-3-4.6z" fill="#7cc4e0" />
      <circle cx="11" cy="9.4" r="1.05" fill="#00628B" />
      <rect x="5.5" y="12.5" width="15.5" height="10" rx="1.6" fill="#ffffff" />
      <path d="M10.6 14.6v5.8M15.6 14.6v5.8" stroke="#00628B" strokeOpacity=".28" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M22.4 15.2h4.4l3.7 4.4v2.9h-8.1z" fill="#ffffff" />
      <path d="M23.9 16.6h2.3l2.3 2.8h-4.6z" fill="#00628B" />
      <circle cx="10.5" cy="24.6" r="2.6" fill="#00628B" stroke="#ffffff" strokeWidth="1.7" />
      <circle cx="25.6" cy="24.6" r="2.6" fill="#00628B" stroke="#ffffff" strokeWidth="1.7" />
      <path d="M5 30h26" stroke="#ffffff" strokeOpacity=".45" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 2.6" />
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
      {/* On a brand-coloured background the mark would blend in, so outline it. */}
      <LogoMark className={light ? "h-9 w-9 rounded-[9px] ring-1 ring-white/50" : undefined} />
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
