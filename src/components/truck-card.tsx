import Link from "next/link";
import { TruckBadge } from "./status-badge";
import { Avatar, TruckThumb } from "./photos";
import type { Truck } from "@/lib/types";

export function TruckCard({ truck }: { truck: Truck }) {
  const owner = truck.owner;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-card">
      <div className="relative">
        <TruckThumb photos={truck.photos} alt={truck.plateNumber} />
        <div className="absolute left-3 top-3">
          <TruckBadge status={truck.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg leading-tight text-navy">
              {truck.truckType}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {truck.plateNumber} · {truck.currentLocation}
            </p>
          </div>
        </div>

        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Capacity</dt>
            <dd className="font-medium text-navy">{truck.capacity} tons</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Preferred route</dt>
            <dd className="text-right font-medium text-navy">
              {truck.preferredRoute}
            </dd>
          </div>
          {owner ? (
            <div className="flex items-center justify-between gap-3 border-t border-line pt-2.5">
              <dt className="text-muted">Owner</dt>
              <dd className="flex items-center gap-2 font-medium text-navy">
                <Avatar src={owner.photo ?? undefined} name={owner.name} size="sm" />
                {owner.name}
              </dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-4 line-clamp-2 text-sm text-muted">{truck.description}</p>
        <Link
          href={`/trucks/${truck.id}`}
          className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-card"
        >
          View details
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
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </article>
  );
}