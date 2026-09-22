import Link from "next/link";
import { BrandLink } from "./brand";

export function AuthShell({
  children,
  image,
}: {
  children: React.ReactNode;
  image: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-5 py-4 lg:hidden">
        <BrandLink />
        <Link href="/" className="text-sm font-semibold text-brand">
          Home
        </Link>
      </header>

      <div className="flex flex-1">
        <main className="flex w-full flex-col items-center justify-center gap-6 px-5 pb-12 pt-4 lg:w-1/2 lg:px-10 lg:pb-0">
          <div className="hidden w-full max-w-xl lg:block">
            <BrandLink />
          </div>
          {children}
        </main>

        <aside className="relative hidden overflow-hidden lg:block lg:w-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt="Truck driving along a cargo corridor"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/15 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-10 lg:p-12">
            <p className="max-w-md font-display text-3xl leading-snug text-white lg:text-4xl">
              Direct cargo–truck marketplace.
            </p>
            <p className="mt-3 max-w-md text-white/75">
              Book an available truck and it locks for you immediately. Agree
              the price, the owner accepts or rejects, and your cargo moves —
              no broker in between.
            </p>
            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
              {[
                ["Direct", "contact owner"],
                ["No broker", "commissions"],
                ["Locked", "on booking"],
              ].map(([title, sub]) => (
                <div key={title}>
                  <dt className="font-display text-sm text-white">{title}</dt>
                  <dd className="mt-0.5 text-xs text-white/65">{sub}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}