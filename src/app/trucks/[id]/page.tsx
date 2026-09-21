"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLink } from "@/components/brand";
import { PayNotice, TruckBadge } from "@/components/status-badge";
import { Avatar, TruckGallery } from "@/components/photos";
import { useIbanga } from "@/lib/store";
import type { Truck } from "@/lib/types";

export default function TruckDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUser, fetchTruck } = useIbanga();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTruck(id)
      .then((t) => {
        if (!cancelled) setTruck(t);
      })
      .catch(() => {
        if (!cancelled) setTruck(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, fetchTruck]);

  const owner = truck?.owner;

  if (loading) {
    return <div className="p-8 text-muted">Loading truck…</div>;
  }

  if (!truck) {
    return (
      <div className="p-8">
        <p>Truck not found.</p>
        <Link href="/trucks" className="text-brand">
          Back to search
        </Link>
      </div>
    );
  }

  const canBook =
    truck.status === "AVAILABLE" &&
    (!currentUser || currentUser.role === "IMPORTER");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <BrandLink />
          <Link href="/trucks" className="text-sm font-semibold text-brand">
            All trucks
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-3xl border border-line bg-card p-6 sm:p-8">
          <TruckGallery
            photos={truck.photos}
            alt={truck.plateNumber}
            className="aspect-4/3 sm:aspect-video"
          />
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">{truck.plateNumber}</p>
              <h1 className="font-display text-3xl text-navy">
                {truck.truckType} · {truck.capacity} tons
              </h1>
            </div>
            <TruckBadge status={truck.status} />
          </div>
          <p className="mt-4 text-muted">{truck.description}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted">Current location</dt>
              <dd className="font-medium text-navy">{truck.currentLocation}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Preferred route</dt>
              <dd className="font-medium text-navy">{truck.preferredRoute}</dd>
            </div>
          </dl>

          {owner ? (
            <div className="mt-8 rounded-2xl bg-background p-5">
              <h2 className="font-display text-xl text-navy">
                Owner contact
              </h2>
              <p className="mt-1 text-sm text-muted">
                After you book, the truck is held. Use this number to agree the
                price, then the owner accepts or rejects.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar name={owner.name} />
                <p className="font-medium text-navy">{owner.name}</p>
              </div>
              <p className="mt-2 text-navy">{owner.phone}</p>
              <p className="text-sm text-muted">{owner.email}</p>
              <p className="mt-2 text-sm text-muted">Based in {owner.location}</p>
            </div>
          ) : null}

          <div className="mt-6">
            <PayNotice />
          </div>

          {canBook ? (
            <Link
              href={
                currentUser
                  ? `/bookings/new?truck=${truck.id}`
                  : `/login?next=${encodeURIComponent(`/bookings/new?truck=${truck.id}`)}`
              }
              className="mt-6 inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Book this truck
            </Link>
          ) : (
            <p className="mt-6 text-sm text-muted">
              {truck.status !== "AVAILABLE"
                ? "This truck is already held by a booking and cannot be booked."
                : "Only importers can submit a booking. Log in with an importer account."}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
