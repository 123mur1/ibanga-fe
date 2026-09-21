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
    setPrice(currentPrice);
  }, [currentPrice]);

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <h2 className="font-display text-xl text-navy">Agree the price</h2>
      <p className="mt-1 text-sm text-muted">
        The truck is already held (unavailable). Write the transport fee you
        both agreed. Payment still happens outside iBanga.
      </p>
      {pending ? (
        <div className="mt-4 space-y-3">
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
            onClick={() => {
              const err = setAgreedPrice(bookingId, price);
              if (!err) setSaved(true);
            }}
          >
            Save price
          </PrimaryButton>
          {saved ? <p className="text-sm text-good">Price saved.</p> : null}
        </div>
      ) : (
        <p className="mt-3 font-semibold text-navy">
          {currentPrice || "No price recorded"}
        </p>
      )}
    </div>
  );
}
