"use client";

import { useEffect, useState } from "react";
import { Field, inputClass, PrimaryButton } from "./ui";
import { useIbanga } from "@/lib/store";

export function PriceAgree({
  bookingId,
  currentPrice,
  pending,
}: {
  bookingId: string;
  currentPrice: string;
  pending: boolean;
}) {
  const { setAgreedPrice } = useIbanga();
  const [price, setPrice] = useState(currentPrice);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setPrice(currentPrice), 0);
    return () => window.clearTimeout(timer);
  }, [currentPrice]);

  return (
    <div className="group rounded-2xl border border-line bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand transition duration-200 [&_svg]:h-[14px] [&_svg]:w-[14px] group-hover:scale-105 group-hover:bg-brand group-hover:text-white">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2v20M17 5.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </span>
        <div>
          <h2 className="font-display text-xl text-navy">Agree the price</h2>
          <p className="text-sm text-muted">
            The truck is already held (unavailable). Payment happens outside
            iBanga.
          </p>
        </div>
      </div>
      {pending ? (
        <div className="mt-5 space-y-3 border-t border-line pt-5">
          <Field label="Agreed price">
            <input
              className={inputClass}
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setSaved(false);
              }}
              placeholder="e.g. RWF 1,800,000 or USD 1,200"
            />
          </Field>
          <PrimaryButton
            type="button"
            className="group"
            onClick={async () => {
              const err = await setAgreedPrice(bookingId, price);
              if (!err) setSaved(true);
            }}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/20 transition duration-200 group-hover:scale-110">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21 5 12 19 3 19 21Z" />
              </svg>
            </span>
            Save price
          </PrimaryButton>
          {saved ? <p className="text-sm text-good">Price saved.</p> : null}
        </div>
      ) : (
        <p className="mt-4 border-t border-line pt-4 font-semibold text-navy">
          {currentPrice || "No price recorded"}
        </p>
      )}
    </div>
  );
}
