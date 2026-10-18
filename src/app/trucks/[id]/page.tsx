"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { PublicNavbar } from "@/components/public-navbar";
import { TruckBadge } from "@/components/status-badge";
import { Avatar, TruckGallery } from "@/components/photos";
import { inputClass, PrimaryButton, formatDate } from "@/components/ui";
import { withNext } from "@/lib/redirect";
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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand [&_svg]:h-[18px] [&_svg]:w-[18px]">{icon}</span>
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
  const { currentUser, fetchTruck, reviews, addReview } = useIbanga();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState("1");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [postingReview, setPostingReview] = useState(false);

  useEffect(() => {
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
  }, [id, fetchTruck]);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted sm:px-6 lg:px-8">Loading truck…</div>;
  }

  if (!truck) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="font-display text-2xl text-navy">Truck not found</p>
        <p className="mt-2 text-muted">It may have been removed or the link is wrong.</p>
        <Link href="/#available-trucks" className="mt-5 inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
          Back to available trucks
        </Link>
      </div>
    );
  }

  const owner = truck.owner;
  const reviewPath = `/trucks/${truck.id}#reviews`;
  const truckReviews = reviews
    .filter((review) => review.truckId === truck.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const average = truckReviews.length
    ? truckReviews.reduce((sum, review) => sum + review.rating, 0) / truckReviews.length
    : 0;
  const alreadyReviewed = Boolean(currentUser && truckReviews.some((review) => review.authorId === currentUser.id));
  const tons = Number(quantity);
  const loadShare = Number.isFinite(tons) && tons > 0 ? Math.min(100, Math.round((tons / truck.capacity) * 100)) : 0;
  const canBook =
    truck.status === "AVAILABLE" &&
    truck.priceRwf != null &&
    (!currentUser || currentUser.role === "IMPORTER");

  function stepQuantity(direction: 1 | -1) {
    if (!truck) return;
    const next = (Number(quantity) || 0) + direction * 0.5;
    setQuantity(String(Math.min(truck.capacity, Math.max(0.5, next))));
    setQuantityError(null);
  }

  function sendBooking() {
    if (!truck) return;
    if (!Number.isFinite(tons) || tons <= 0) return setQuantityError("Enter how many tons you are shipping.");
    if (tons > truck.capacity) return setQuantityError(`This truck carries up to ${truck.capacity} tons.`);
    const path = `/bookings/new?truck=${truck.id}&quantity=${tons}`;
    router.push(currentUser ? path : withNext("/login", path));
  }

  async function submitReview(event: FormEvent) {
    event.preventDefault();
    if (!truck) return;
    if (!rating) return setReviewError("Choose a star rating.");
    setPostingReview(true);
    setReviewError(null);
    const error = await addReview(truck.id, { rating, comment });
    setPostingReview(false);
    if (error) return setReviewError(error);
    setRating(0);
    setComment("");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/" className="font-medium hover:text-brand">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/#available-trucks" className="font-medium hover:text-brand">Available trucks</Link>
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
              {truck.currentLocation}
            </span>
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
        <TruckBadge status={truck.status} />
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        {/* Booking panel: first on small screens, sticky on the right on large ones */}
        <aside aria-label="Book this truck" className="order-first lg:sticky lg:top-24 lg:order-last">
          <div className="overflow-hidden rounded-3xl border border-line bg-card shadow-card">
            <div className="bg-brand px-6 py-5 text-white">
              <p className="text-sm font-medium text-white/80">Price per booking</p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
                {truck.priceRwf == null ? "Not priced" : `RWF ${truck.priceRwf.toLocaleString("en-RW")}`}
              </p>
              <p className="mt-1 text-xs text-white/75">Fixed listing price. No negotiation, no hidden fees.</p>
            </div>

            <div className="space-y-5 p-6">
              {canBook ? (
                <>
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <label htmlFor="quantity" className="text-sm font-semibold text-navy">Quantity</label>
                      <span className="text-xs text-muted">Up to {truck.capacity} tons</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => stepQuantity(-1)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-xl font-semibold text-navy transition hover:border-brand hover:text-brand"
                      >
                        −
                      </button>
                      <div className="relative flex-1">
                        <input
                          id="quantity"
                          className={`${inputClass} pr-14 text-center text-lg font-semibold`}
                          type="number"
                          min="0.5"
                          max={truck.capacity}
                          step="0.5"
                          inputMode="decimal"
                          value={quantity}
                          onChange={(event) => {
                            setQuantity(event.target.value);
                            setQuantityError(null);
                          }}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">tons</span>
                      </div>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => stepQuantity(1)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-xl font-semibold text-navy transition hover:border-brand hover:text-brand"
                      >
                        +
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[0.25, 0.5, 0.75, 1].map((share) => (
                        <button
                          key={share}
                          type="button"
                          onClick={() => {
                            setQuantity(String(Math.max(0.5, Math.round(truck.capacity * share * 2) / 2)));
                            setQuantityError(null);
                          }}
                          className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-navy transition hover:border-brand hover:text-brand"
                        >
                          {share === 1 ? "Full load" : `${share * 100}%`}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted">
                        <span>Truck load</span>
                        <span className="font-semibold text-navy">{loadShare}%</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${loadShare}%` }} />
                      </div>
                    </div>
                    {quantityError ? <p role="alert" className="mt-2 text-sm font-medium text-bad">{quantityError}</p> : null}
                  </div>

                  <div className="space-y-2.5">
                    <PrimaryButton type="button" className="w-full py-3" onClick={sendBooking}>
                      Send booking
                      <svg width="16" height="16" {...iconProps} strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </PrimaryButton>
                    {!currentUser ? (
                      <p className="text-center text-xs leading-5 text-muted">
                        You will be asked to log in first, then you come straight back to your booking.
                      </p>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="rounded-xl bg-background px-4 py-3 text-sm leading-6 text-muted">
                  {truck.status !== "AVAILABLE"
                    ? "This truck is already held by a booking and cannot be booked right now."
                    : truck.priceRwf == null
                      ? "This truck needs an RWF price before importers can book it."
                      : "Only importers can submit a booking. Log in with an importer account."}
                </p>
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
              <Spec label="Preferred route" value={truck.preferredRoute || "—"} icon={<svg {...iconProps}><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="5" r="2.5" /><path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" /></svg>} />
            </div>
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
                <p className="mt-1 text-sm text-muted">What importers say about shipping with this truck.</p>
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
                            <p className="text-sm font-semibold text-navy">{review.authorName}</p>
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
                {!currentUser ? (
                  <>
                    <p className="text-sm leading-6 text-muted">Log in to tell other importers how this truck performed.</p>
                    <div className="flex flex-wrap gap-3">
                      <Link href={withNext("/login", reviewPath)} className="inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Log in</Link>
                      <Link href={withNext("/register", reviewPath, { role: "IMPORTER" })} className="inline-flex rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:border-brand/40">Create account</Link>
                    </div>
                  </>
                ) : currentUser.role !== "IMPORTER" ? (
                  <p className="text-sm text-muted">Only importers can review a truck.</p>
                ) : alreadyReviewed ? (
                  <p className="text-sm text-muted">Thanks, you have already reviewed this truck.</p>
                ) : (
                  <>
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
