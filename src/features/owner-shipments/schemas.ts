import { z } from "zod";

export const delaySchema = z.object({
  reason: z.string().trim().min(5, "Explain the delay in a few words."),
  newEtaDate: z.string().min(1, "Choose the new estimated delivery date."),
});
export type DelayValues = z.infer<typeof delaySchema>;

export const evidenceSchema = z
  .object({
    recipientName: z.string().trim().min(2, "Enter who received the cargo."),
    confirmationCode: z.string().trim().min(3, "Enter the delivery confirmation code."),
    deliveredAt: z.string().min(1, "Enter when the cargo was delivered."),
    damageReported: z.boolean(),
    shortageReported: z.boolean(),
    notes: z.string().trim(),
  })
  .refine((value) => !(value.damageReported || value.shortageReported) || value.notes.length >= 5, {
    path: ["notes"],
    message: "Describe the damage or shortage (at least 5 characters).",
  });
export type EvidenceValues = z.infer<typeof evidenceSchema>;
