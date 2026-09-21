"use client";

import { useState } from "react";

export function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-20 w-20 text-xl" : "h-12 w-12 text-sm";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${px} rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <span
      className={`${px} inline-flex items-center justify-center rounded-full bg-brand-soft font-semibold text-brand-dark`}
    >
      {initials}
    </span>
  );
}

function EmptyPhoto({ className = "aspect-4/3" }: { className?: string }) {
  return (
    <div
      className={`${className} flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-navy/8 text-muted`}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <circle cx="8.5" cy="10" r="1.75" />
        <path d="M21 16.5 16 11l-9 8" />
      </svg>
      <span className="text-xs font-medium">No photos yet</span>
    </div>
  );
}

/**
 * Compact cover thumbnail for list rows/cards: first photo, fixed aspect
 * ratio, with a "1 / N" badge when there is more than one photo.
 */
export function TruckThumb({
  photos,
  alt,
  className = "aspect-4/3",
}: {
  photos?: string[] | null;
  alt: string;
  className?: string;
}) {
  const shots = (photos ?? []).filter(Boolean);
  if (!shots.length) return <EmptyPhoto className={className} />;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-navy/8 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shots[0]} alt={alt} className="h-full w-full object-cover" />
      {shots.length > 1 ? (
        <span className="absolute bottom-2 right-2 rounded-full bg-navy/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
          1 / {shots.length}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Full gallery viewer: large main image with a thumbnail strip to switch
 * between photos. Falls back to an empty state when there are none.
 */
export function TruckGallery({
  photos,
  alt,
  className = "aspect-4/3",
}: {
  photos?: string[] | null;
  alt: string;
  className?: string;
}) {
  const shots = (photos ?? []).filter(Boolean);
  const [active, setActive] = useState(0);

  if (!shots.length) return <EmptyPhoto className={className} />;

  const index = Math.min(active, shots.length - 1);

  return (
    <div>
      <div className={`relative overflow-hidden rounded-2xl bg-navy/8 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shots[index]}
          alt={`${alt} photo ${index + 1} of ${shots.length}`}
          className="h-full w-full object-cover"
        />
        {shots.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => setActive((i) => (i - 1 + shots.length) % shots.length)}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-navy/60 text-white hover:bg-navy/80"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => setActive((i) => (i + 1) % shots.length)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-navy/60 text-white hover:bg-navy/80"
            >
              ›
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-navy/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
              {index + 1} / {shots.length}
            </span>
          </>
        ) : null}
      </div>
      {shots.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {shots.map((src, i) => (
            <button
              key={src.slice(0, 64) + i}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition ${
                i === index ? "ring-brand" : "ring-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const MAX_TRUCK_PHOTOS = 6;

/**
 * Multi-photo picker for the truck form: a grid of previews (each
 * removable) plus an "add photo" tile, up to MAX_TRUCK_PHOTOS.
 */
export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function addFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const room = MAX_TRUCK_PHOTOS - photos.length;
    if (room <= 0) return;
    setBusy(true);
    try {
      const picked = Array.from(files).slice(0, room);
      const dataUrls = await Promise.all(picked.map(readImageFile));
      onChange([...photos, ...dataUrls]);
    } finally {
      setBusy(false);
    }
  }

  function remove(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((src, i) => (
          <div key={src.slice(0, 64) + i} className="group relative aspect-square overflow-hidden rounded-xl bg-navy/8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => remove(i)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-navy/70 text-sm font-semibold text-white hover:bg-bad"
            >
              ×
            </button>
            {i === 0 ? (
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-navy/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Cover
              </span>
            ) : null}
          </div>
        ))}
        {photos.length < MAX_TRUCK_PHOTOS ? (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-muted hover:border-brand hover:text-brand">
            <span className="text-2xl leading-none">+</span>
            <span className="text-xs font-medium">{busy ? "Adding…" : "Add photo"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted">
        {photos.length}/{MAX_TRUCK_PHOTOS} photos. The first photo is used as the cover.
      </p>
    </div>
  );
}

export function readImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
