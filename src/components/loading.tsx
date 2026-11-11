import Image from "next/image";
import ibangaLogo from "./common/iBanga Logistics Logo.png";

export function LoadingTruck({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 112 56"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 10h59a3 3 0 0 1 3 3v23H7z" fill="#00628B" />
      <path d="M69 21h18l15 13v5H69z" fill="#0789B6" />
      <path d="M75 26h10l10 9H75z" fill="#DDF5FF" />
      <path d="M12 16h48M12 22h48M12 28h48" stroke="#fff" strokeOpacity=".3" strokeWidth="2" />
      <path d="M4 36h98" stroke="#073B53" strokeWidth="3" strokeLinecap="round" />
      <g className="ibanga-loading-wheel">
        <circle cx="26" cy="39" r="8" fill="#122B3B" />
        <circle cx="26" cy="39" r="3.5" fill="#D9E7EC" />
        <path d="M26 36v6m-3-3h6" stroke="#78909C" strokeWidth="1.2" />
      </g>
      <g className="ibanga-loading-wheel">
        <circle cx="85" cy="39" r="8" fill="#122B3B" />
        <circle cx="85" cy="39" r="3.5" fill="#D9E7EC" />
        <path d="M85 36v6m-3-3h6" stroke="#78909C" strokeWidth="1.2" />
      </g>
      <path d="M101 35h5" stroke="#0789B6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function WorkspaceLoading({
  label = "Loading your workspace",
  detail = "Getting everything ready for the road ahead.",
  compact = false,
}: {
  label?: string;
  detail?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex w-full items-center justify-center px-4 py-8 sm:px-6 ${
        compact ? "min-h-72" : "min-h-[55vh]"
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-4xl border border-sky-100 bg-white p-6 shadow-[0_24px_70px_-38px_rgba(0,98,139,0.42)] sm:p-9">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-52 w-52 rounded-full bg-cyan-100/60 blur-3xl" />
        <div className="relative flex flex-col items-center text-center">
          <Image
            src={ibangaLogo}
            alt=""
            width={1774}
            height={887}
            className="h-20 w-40 object-contain sm:h-24 sm:w-48"
            loading="eager"
          />
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500 motion-reduce:animate-none" />
            Freight in motion
          </span>
          <h2 className="mt-4 font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
            {label}
          </h2>
          <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted">{detail}</p>

          <div className="ibanga-loading-scene relative mt-7 h-28 w-full overflow-hidden rounded-2xl border border-sky-100/80">
            <div className="ibanga-route-glow absolute inset-x-8 top-1/2 h-8 -translate-y-1/2 rounded-full bg-sky-100/70 blur-xl" />
            <div className="absolute inset-x-7 top-1/2 border-t-2 border-dashed border-sky-200" />
            <span className="absolute left-7 top-[calc(50%-4px)] h-2 w-2 rounded-full bg-cyan-500 ring-4 ring-white" />
            <span className="absolute right-7 top-[calc(50%-4px)] h-2 w-2 rounded-full bg-brand ring-4 ring-white" />
            <div className="ibanga-truck-drive absolute left-[calc(50%-3.5rem)] top-[calc(50%-1.75rem)] z-10">
              <LoadingTruck className="h-14 w-28 drop-shadow-[0_8px_8px_rgba(0,57,79,0.18)]" />
            </div>
            <div className="ibanga-road-flow absolute inset-x-0 bottom-0 h-1.5 bg-[linear-gradient(90deg,#d9f3fb_0%,#0087b5_50%,#d9f3fb_100%)]" />
          </div>

          <div className="mt-5 flex items-center gap-2" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand motion-reduce:animate-none" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand/70 [animation-delay:150ms] motion-reduce:animate-none" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand/40 [animation-delay:300ms] motion-reduce:animate-none" />
            <span className="ml-1 text-[11px] font-semibold tracking-wide text-muted">
              CONNECTING THE ROUTE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
