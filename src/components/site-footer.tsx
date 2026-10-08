import Image from "next/image";

type TeamContact = {
  name: string;
  phone: string;
  photo: string;
};

const teamContacts: TeamContact[] = [
  { name: "MUROKORE PATRICK", phone: "+250 792 017 511", photo: "/photos/image1.jpg" },
  { name: "danny mfitumurengezi", phone: "+250 786 194 583", photo: "/photos/image2.jpg" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy px-4 py-7 text-sm text-white/70">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-7 sm:grid-cols-[0.8fr_1.2fr] sm:items-center">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 font-display text-lg font-semibold text-white ring-1 ring-white/15">
                i
              </span>
              <div>
                <p className="font-display text-xl leading-none text-white">iBanga</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-white/45">
                  Cargo &amp; transport
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              Connecting cargo owners and truck operators across the region.
              Our team is here to help with your iBanga experience.
            </p>
          </div>

          <section
            aria-labelledby="team-support-heading"
            className="sm:justify-self-end"
          >
            <div className="mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-soft">
                Need a hand?
              </p>
              <h2
                id="team-support-heading"
                className="mt-1 font-display text-xl text-white"
              >
                Talk to our team
              </h2>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {teamContacts.map((contact) => (
                <li
                  key={contact.name}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-white/20 hover:bg-white/8"
                >
                  {contact.photo ? (
                    <Image
                      src={contact.photo}
                      alt={`${contact.name} profile`}
                      width={48}
                      height={48}
                      className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white/15"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-brand-soft ring-2 ring-white/10"
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                      </svg>
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {contact.name}
                    </p>
                    <p className="mt-0.5 text-xs text-white/45">
                      iBanga support
                    </p>
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}
                        aria-label={`Call ${contact.name} at ${contact.phone}`}
                        className="mt-1 inline-flex items-center gap-1.5 rounded-md text-xs font-semibold text-brand-soft transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-soft"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        {contact.phone}
                      </a>
                    ) : (
                      <p className="mt-1 text-xs text-white/50">
                        Add phone number
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} iBanga · cargo–truck marketplace
          </span>
          <span>Payments in RWF · MTN Mobile Money supported</span>
        </div>
      </div>
    </footer>
  );
}
