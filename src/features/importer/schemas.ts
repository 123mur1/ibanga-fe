import { z } from "zod";

export const CANCEL_REASONS = [
  "Cargo plans changed",
  "Found a better price or truck",
  "Pickup date no longer works",
  "Booking details were wrong",
  "Truck owner is unresponsive",
  "Other",
] as const;

export const cancelBookingSchema = z
  .object({
    reason: z.string().min(1, "Choose a reason."),
    details: z.string().trim().max(1000, "Keep the details under 1,000 characters."),
  })
  .superRefine((value, context) => {
    if (value.reason === "Other" && value.details.length < 10) {
      context.addIssue({ code: "custom", path: ["details"], message: "Tell us more (at least 10 characters) when the reason is Other." });
    }
  });

export type CancelBookingValues = z.infer<typeof cancelBookingSchema>;
