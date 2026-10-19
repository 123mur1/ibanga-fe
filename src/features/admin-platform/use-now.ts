"use client";

import { useState } from "react";

/** Timestamp captured once on mount, so render stays pure while still allowing age maths. */
export function useNow(): number {
  const [now] = useState(() => Date.now());
  return now;
}
