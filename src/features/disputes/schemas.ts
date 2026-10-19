import { z } from "zod";
import type { DisputeCategory } from "@/types/ops";

export const DISPUTE_CATEGORIES = ["DAMAGED_CARGO", "MISSING_CARGO", "LATE_DELIVERY", "PAYMENT_ISSUE", "OVERCHARGE", "DRIVER_CONDUCT", "OTHER"] as const;

export const DISPUTE_CATEGORY_LABELS: Record<DisputeCategory, string> = {
  DAMAGED_CARGO: "Damaged cargo",
  MISSING_CARGO: "Missing or short cargo",
  LATE_DELIVERY: "Late delivery",
  PAYMENT_ISSUE: "Payment issue",
  OVERCHARGE: "Overcharge",
  DRIVER_CONDUCT: "Driver conduct",
  OTHER: "Something else",
};

export const disputeSchema = z.object({
  bookingId: z.string().min(1, "Choose the booking this dispute is about."),
  category: z.enum(DISPUTE_CATEGORIES),
  description: z.string().trim().min(20, "Describe the problem in at least 20 characters."),
});

export const disputeReplySchema = z.object({
  text: z.string().trim().min(2, "Write a message first."),
});
