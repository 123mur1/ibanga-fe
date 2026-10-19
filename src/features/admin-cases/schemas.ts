import { z } from "zod";

export const noteSchema = z.object({
  text: z.string().trim().min(3, "Write a note of at least 3 characters."),
  visibility: z.enum(["internal", "parties"]),
});

export const messageSchema = z.object({ text: z.string().trim().min(2, "Write a message first.") });

export const infoRequestSchema = z.object({ request: z.string().trim().min(5, "Say what information you need (at least 5 characters).") });

export const proposalSchema = z.object({ proposal: z.string().trim().min(5, "Describe the proposed resolution (at least 5 characters).") });

export const decisionSchema = z
  .object({
    type: z.enum(["NO_ACTION", "PARTIAL_REFUND", "FULL_REFUND", "COMPENSATION", "RELEASE_TO_OWNER"]),
    amountRwf: z.number({ error: "Enter an amount." }).min(0, "Amount cannot be negative."),
    note: z.string().trim().min(5, "Record the reasoning (at least 5 characters)."),
  })
  .refine((value) => ["NO_ACTION", "RELEASE_TO_OWNER"].includes(value.type) || value.amountRwf > 0, {
    path: ["amountRwf"],
    message: "Enter the decided amount.",
  });

export const statusNoteSchema = z.object({ note: z.string().trim().min(5, "Give a reason (at least 5 characters).") });

export const claimNoteSchema = z.object({ note: z.string().trim().max(500, "Keep the note under 500 characters.") });
