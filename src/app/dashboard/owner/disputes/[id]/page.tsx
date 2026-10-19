"use client";

import { useParams } from "next/navigation";
import { DisputeDetail } from "@/features/disputes/dispute-detail";

export default function DisputePage() {
  const { id } = useParams<{ id: string }>();
  return <DisputeDetail role="TRUCK_OWNER" id={id} />;
}
