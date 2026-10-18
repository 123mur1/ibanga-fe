import { PublicNavbar } from "./public-navbar";

export function AuthShell({
  children,
  image,
  showImage = true,
  fitScreen = false,
}: {
  children: React.ReactNode;
  image?: string;
  showImage?: boolean;
  /** Lock the layout to the viewport so the page itself never scrolls. */
  fitScreen?: boolean;
}) {
  return (
    <div className={`flex flex-col bg-background ${fitScreen ? "h-dvh overflow-hidden" : "min-h-screen"}`}>
      <PublicNavbar />

      <div className={`flex flex-1 ${fitScreen ? "min-h-0" : ""}`}>
        <main className={`flex w-full flex-col items-center justify-center gap-6 px-5 ${fitScreen ? "min-h-0 py-4 lg:px-10" : "pb-12 pt-4"} ${showImage ? (fitScreen ? "lg:w-1/2" : "lg:w-1/2 lg:px-10 lg:pb-0") : "lg:px-8 lg:py-10"}`}>
          {children}
        </main>

        {showImage && image ? (
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
        ) : null}
      </div>
    </div>
  );
}