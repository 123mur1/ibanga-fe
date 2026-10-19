"use client";

import { useParams } from "next/navigation";
import { TicketDetail } from "@/features/support/ticket-detail";

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  return <TicketDetail role="TRUCK_OWNER" id={id} />;
}
