"use client";

import { Suspense } from "react";
import { LoadingBlock } from "@/components/common/async-state";
import { DisputeForm } from "@/features/disputes/dispute-form";

export default function NewDisputePage() {
  // useSearchParams (the ?booking=<id> link) needs a Suspense boundary.
  return (
    <Suspense fallback={<LoadingBlock />}>
      <DisputeForm role="IMPORTER" />
    </Suspense>
  );
}
