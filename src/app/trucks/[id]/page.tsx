"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PublicNavbar } from "@/components/public-navbar";
import { WorkspaceLoading } from "@/components/loading";
import { TruckVerifiedBadge } from "@/components/status-badge";
import { Avatar, TruckGallery } from "@/components/photos";
import { inputClass, PrimaryButton, formatDate } from "@/components/ui";
import { AvailabilityDialog, type DateRange } from "@/components/availability-calendar";
import { useBookedRanges } from "@/hooks/use-booked-ranges";
import { formatDay, nextFreeDay, todayKey } from "@/lib/availability";
import { withNext } from "@/lib/redirect";
import { UNVERIFIED_TRUCK_MESSAGE, useTruckVerification } from "@/hooks/use-truck-verification";
import { useIbanga } from "@/lib/store";
import type { Truck } from "@/lib/types";

function Stars({ value, size = "md" }: { value: number; size?: "md" | "lg" }) {
  return (
    <span aria-label={`${value.toFixed(1)} out of 5 stars`} className={`inline-flex gap-0.5 leading-none ${size === "lg" ? "text-2xl" : "text-base"}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} aria-hidden="true" className={star <= Math.round(value) ? "text-amber-500" : "text-line"}>★</span>
      ))}
    </span>
  );
}

function Spec({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand [&_svg]:h-4.5 [&_svg]:w-4.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-0.5 truncate font-semibold text-navy">{value}</p>
      </div>
    </div>
  );
}

const iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

function TruckDetailsContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentUser, fetchTruck, reviews, addReview, ready } = useIbanga();
  const bookedFor = useBookedRanges();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [postingReview, setPostingReview] = useState(false);

  useEffect(() => {
    // Wait for the marketplace store to finish loading: on a direct visit this effect would
    // otherwise run first and report a valid truck as missing.
    if (!ready) return;
    let cancelled = false;
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
  }, [id, fetchTruck, ready]);
  const verification = useTruckVerification(truck);

  if (loading) {
    return (
      <WorkspaceLoading
        label="Finding your truck"
        detail="Loading vehicle details and availability."
      />
    );
  }

  // Unverified trucks are hidden from importers and visitors (the API returns 404 for them too);
  // only the owner and administrators can open them.
  const hiddenFromViewer =
    truck != null && verification !== "APPROVED" && currentUser?.role !== "ADMIN" && currentUser?.id !== truck.ownerId;

  // Importers search from their dashboard; everyone else from the public marketplace.
  const browsePath = currentUser?.role === "IMPORTER" ? "/dashboard/importer/trucks" : "/trucks";

  if (!truck || hiddenFromViewer) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="font-display text-2xl text-navy">Truck not found</p>
        <p className="mt-2 text-muted">It may have been removed or the link is wrong.</p>
        <Link href={browsePath} className="mt-5 inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
          Back to available trucks
        </Link>
      </div>
    );
  }

  const owner = truck.owner;
  const truckReviews = reviews
    .filter((review) => review.truckId === truck.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const average = truckReviews.length
    ? truckReviews.reduce((sum, review) => sum + review.rating, 0) / truckReviews.length
    : 0;
  const alreadyReviewed = Boolean(currentUser && truckReviews.some((review) => review.authorId === currentUser.id));
  const ownVehicle = currentUser?.id === truck.ownerId;
  const verified = verification === "APPROVED";
  const destinations = truck.destinations ?? [];
  const cargo = truck.acceptedCargo ?? [];
  const booked = bookedFor(truck);
  const upcoming = booked.filter((range) => range.end >= todayKey());
  const freeDay = nextFreeDay(booked);
  const canBook =
    verified &&
    truck.pricePerKmRwf != null &&
    destinations.length > 0 &&
    (!currentUser || currentUser.role === "IMPORTER");

  function continueWithDates(range: DateRange) {
    if (!truck) return;
    const path = `/bookings/new?truck=${truck.id}&from=${range.start}&to=${range.end}`;
    setCalendarOpen(false);
    // Visitors log in first and come straight back to the booking with their dates.
    router.push(currentUser ? path : withNext("/login", path));
  }

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!truck) return;
    if (!currentUser && guestName.trim().length < 2) return setReviewError("Enter your name.");
    if (!rating) return setReviewError("Choose a star rating.");
    setPostingReview(true);
    setReviewError(null);
    const error = await addReview(truck.id, { rating, comment, authorName: currentUser ? undefined : guestName.trim() });
    setPostingReview(false);
    if (error) return setReviewError(error);
    setRating(0);
    setComment("");
    setGuestName("");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/" className="font-medium hover:text-brand">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href={browsePath} className="font-medium hover:text-brand">Available trucks</Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-navy">{truck.plateNumber}</span>
      </nav>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-navy sm:text-4xl">
            {truck.truckType} · {truck.capacity} tons
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            <span className="rounded-md bg-navy px-2.5 py-1 font-mono text-xs font-semibold tracking-wider text-white">{truck.plateNumber}</span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="16" {...iconProps}><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>
              Now in {truck.currentLocation || "an unlisted place"}
            </span>
            {truck.category ? <span>{truck.category}</span> : null}
            {truckReviews.length ? (
              <a href="#reviews" className="inline-flex items-center gap-2 font-semibold text-navy hover:text-brand">
                <Stars value={average} />
                {average.toFixed(1)} <span className="font-normal text-muted">({truckReviews.length} review{truckReviews.length === 1 ? "" : "s"})</span>
              </a>
            ) : (
              <a href="#reviews" className="hover:text-brand">No reviews yet</a>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TruckVerifiedBadge verification={verification} />
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        {/* Booking panel: first on small screens, sticky on the right on large ones */}
        <aside aria-label="Book this truck" className="order-first lg:sticky lg:top-24 lg:order-last">
          <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-card">
            <div className="bg-brand px-6 py-5 text-white">
              <p className="text-sm font-medium text-white/80">Price per kilometre</p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
                {truck.pricePerKmRwf == null ? "Not priced" : `RWF ${truck.pricePerKmRwf.toLocaleString("en-RW")}`}
              </p>
              <p className="mt-1 text-xs text-white/75">Your trip price is the road distance from {truck.currentLocation || "the vehicle"} to your destination, times this rate.</p>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-4 py-3 text-sm">
                <span className="text-muted">Next free day</span>
                <span className="font-semibold text-navy">{freeDay === todayKey() ? "Today" : formatDay(freeDay)}</span>
              </div>

              {canBook ? (
                <div className="space-y-2.5">
                  <PrimaryButton type="button" className="w-full py-3" onClick={() => setCalendarOpen(true)}>
                    <svg width="16" height="16" {...iconProps} strokeWidth={2}><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>
                    See availability
                  </PrimaryButton>
                  <p className="text-center text-xs leading-5 text-muted">
                    Choose your dates, then your destination and cargo.{!currentUser ? " You log in before sending the request." : ""}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="rounded-xl bg-background px-4 py-3 text-sm leading-6 text-muted">
                    {!verified
                      ? UNVERIFIED_TRUCK_MESSAGE
                      : truck.pricePerKmRwf == null
                        ? "The owner has not set a price per kilometre yet, so this vehicle cannot be booked."
                        : !destinations.length
                          ? "The owner has not listed any destinations yet, so this vehicle cannot be booked."
                          : "Only importers can book. Log in with an importer account."}
                  </p>
                  <button type="button" onClick={() => setCalendarOpen(true)} className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-brand hover:text-brand">
                    See booked dates
                  </button>
                </div>
              )}

              <ul className="space-y-3 border-t border-line pt-5 text-sm text-navy">
                {[
                  "Your payment is held by iBanga until you confirm delivery.",
                  "Pay by Visa, MTN MoMo or Airtel Money after the owner accepts.",
                  "Not as agreed? Ask for a refund from your payments page.",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5">
                    <svg className="mt-0.5 shrink-0 text-brand" width="16" height="16" {...iconProps} strokeWidth={2}><path d="M20 6 9 17l-5-5" /></svg>
                    <span className="leading-5 text-muted">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {calendarOpen ? (
          <AvailabilityDialog
            title={canBook ? "Choose your dates" : "Booked dates"}
            vehicleLabel={`${truck.truckType} · ${truck.plateNumber} · booked days are in red`}
            booked={booked}
            continueLabel={canBook ? "Continue" : "Close"}
            onClose={() => setCalendarOpen(false)}
            onContinue={canBook ? continueWithDates : () => setCalendarOpen(false)}
          />
        ) : null}

        <div className="min-w-0 space-y-8">
          <section className="rounded-3xl border border-line bg-card p-4 sm:p-5">
            <TruckGallery photos={truck.photos} alt={truck.plateNumber} className="aspect-4/3 sm:aspect-video" />
          </section>

          <section aria-labelledby="specs-heading">
            <h2 id="specs-heading" className="font-display text-xl text-navy">Truck overview</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Spec label="Capacity" value={`${truck.capacity} tons`} icon={<svg {...iconProps}><path d="M12 3v18M5 8l7-5 7 5M5 21h14" /></svg>} />
              <Spec label="Truck type" value={truck.truckType} icon={<svg {...iconProps}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7.5" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" /></svg>} />
              <Spec label="Current location" value={truck.currentLocation || "—"} icon={<svg {...iconProps}><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>} />
              <Spec label="Category" value={truck.category || "—"} icon={<svg {...iconProps}><path d="M4 7h16M4 12h16M4 17h10" /></svg>} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-white p-4">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Delivers to</h3>
                {destinations.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {destinations.map((place) => <li key={place} className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-dark">{place}</li>)}
                  </ul>
                ) : <p className="mt-1 text-sm text-muted">No destinations listed yet.</p>}
              </div>
              <div className="rounded-2xl border border-line bg-white p-4">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Carries</h3>
                {cargo.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {cargo.map((item) => <li key={item} className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-navy ring-1 ring-line">{item}</li>)}
                  </ul>
                ) : <p className="mt-1 text-sm text-muted">Any cargo within its capacity.</p>}
              </div>
            </div>
            {upcoming.length ? (
              <div className="mt-3 rounded-2xl border border-line bg-white p-4">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Already booked</h3>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {upcoming.slice(0, 6).map((range) => (
                    <li key={`${range.start}-${range.end}`} className="rounded-full bg-bad-soft px-2.5 py-1 text-xs font-semibold text-bad">
                      {range.start === range.end ? formatDay(range.start, { day: "numeric", month: "short" }) : `${formatDay(range.start, { day: "numeric", month: "short" })} – ${formatDay(range.end, { day: "numeric", month: "short" })}`}
                    </li>
                  ))}
                  {upcoming.length > 6 ? <li className="px-1 py-1 text-xs text-muted">+{upcoming.length - 6} more</li> : null}
                </ul>
              </div>
            ) : null}
            {truck.description ? (
              <div className="mt-4 rounded-2xl border border-line bg-white p-5">
                <h3 className="text-sm font-semibold text-navy">About this truck</h3>
                <p className="mt-2 leading-7 text-muted">{truck.description}</p>
              </div>
            ) : null}
          </section>

          {owner ? (
            <section aria-labelledby="owner-heading" className="rounded-3xl border border-line bg-card p-5 sm:p-6">
              <h2 id="owner-heading" className="font-display text-xl text-navy">Contact the owner</h2>
              <div className="mt-4 min-w-0">
                <p className="text-sm text-muted">Based in {owner.location}</p>
                {currentUser ? (
                  <p className="mt-1 text-sm text-navy">{[owner.phone, owner.email].filter(Boolean).join(" · ")}</p>
                ) : (
                  <p className="mt-1 text-sm text-muted">Phone and email are shown once you log in.</p>
                )}
              </div>
            </section>
          ) : null}

          <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="reviews-heading" className="font-display text-xl text-navy">Reviews</h2>
                <p className="mt-1 text-sm text-muted">What people say about this vehicle. Anyone can read and write reviews, no account needed.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)]">
              <div className="space-y-4">
                {truckReviews.length ? (
                  <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-line bg-white p-5">
                    <div className="text-center">
                      <p className="font-display text-4xl font-semibold text-navy">{average.toFixed(1)}</p>
                      <Stars value={average} />
                      <p className="mt-1 text-xs text-muted">{truckReviews.length} review{truckReviews.length === 1 ? "" : "s"}</p>
                    </div>
                    <ul className="min-w-48 flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = truckReviews.filter((review) => review.rating === star).length;
                        return (
                          <li key={star} className="flex items-center gap-2 text-xs text-muted">
                            <span className="w-4 text-right font-semibold text-navy">{star}</span>
                            <span aria-hidden="true" className="text-amber-500">★</span>
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                              <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(count / truckReviews.length) * 100}%` }} />
                            </span>
                            <span className="w-4 tabular-nums">{count}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}

                <ul className="space-y-3">
                  {truckReviews.length === 0 ? (
                    <li className="rounded-2xl border border-dashed border-line bg-white px-5 py-10 text-center text-sm text-muted">
                      Nobody has reviewed this truck yet. Be the first to share your experience.
                    </li>
                  ) : truckReviews.map((review) => (
                    <li key={review.id} className="rounded-2xl border border-line bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={review.authorPhoto} name={review.authorName} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-navy">
                              {review.authorName}
                              {review.guest ? <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted ring-1 ring-line">Guest</span> : null}
                            </p>
                            <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
                          </div>
                        </div>
                        <Stars value={review.rating} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <form onSubmit={submitReview} className="h-fit space-y-4 rounded-2xl border border-line bg-white p-5">
                <h3 className="font-display text-lg text-navy">Write a review</h3>
                {ownVehicle ? (
                  <p className="text-sm text-muted">You cannot review your own vehicle.</p>
                ) : alreadyReviewed ? (
                  <p className="text-sm text-muted">Thanks, you have already reviewed this vehicle.</p>
                ) : (
                  <>
                    {!currentUser ? (
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium text-navy">Your name</span>
                        <input value={guestName} onChange={(event) => setGuestName(event.target.value)} className={inputClass} autoComplete="name" placeholder="e.g. Jeanine U." maxLength={60} />
                        <span className="mt-1 block text-xs text-muted">No account needed. Your review is shown with this name.</span>
                      </label>
                    ) : null}
                    <fieldset>
                      <legend className="mb-1.5 text-sm font-medium text-navy">Your rating</legend>
                      <div className="flex gap-1" role="radiogroup" aria-label="Rating out of 5 stars">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={rating === value}
                            aria-label={`${value} star${value === 1 ? "" : "s"}`}
                            onClick={() => setRating(value)}
                            className={`text-3xl leading-none transition hover:scale-110 ${value <= rating ? "text-amber-500" : "text-line"}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-navy">Your experience</span>
                      <textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        className={`${inputClass} min-h-28 resize-y`}
                        placeholder="Was the truck on time? How was the driver and the handling of your cargo?"
                      />
                    </label>
                    {reviewError ? <p role="alert" className="text-sm font-medium text-bad">{reviewError}</p> : null}
                    <PrimaryButton type="submit" className="w-full" disabled={postingReview}>
                      {postingReview ? "Posting…" : "Post review"}
                    </PrimaryButton>
                  </>
                )}
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function TruckDetailsPage() {
  // Always the public layout, so logged-in users stay on the marketplace instead of jumping into the dashboard.
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <TruckDetailsContent />
      <footer className="mt-8 border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} iBanga. Freight moves forward.</span>
          <Link href="/register?role=TRUCK_OWNER" className="font-semibold text-brand hover:text-brand-dark">List your truck</Link>
        </div>
      </footer>
    </div>
  );
}
