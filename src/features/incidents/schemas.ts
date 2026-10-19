import { z } from "zod";

export const INCIDENT_TYPES = ["ACCIDENT", "BREAKDOWN", "CARGO_DAMAGE", "MISSING_CARGO", "DRIVER_UNAVAILABLE", "EMERGENCY_DELAY"] as const;
export const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const CONDITIONS = ["INTACT", "PARTIALLY_DAMAGED", "DAMAGED", "LOST"] as const;

export const incidentSchema = z.object({
  shipmentId: z.string().min(1, "Choose the shipment."),
  type: z.enum(INCIDENT_TYPES),
  severity: z.enum(SEVERITIES),
  occurredAt: z.string().min(1, "Enter when it happened."),
  location: z.string().trim().min(2, "Enter where it happened."),
  description: z.string().trim().min(15, "Describe what happened (at least 15 characters)."),
  peopleInvolved: z.string().trim(),
  cargoCondition: z.enum(CONDITIONS),
  immediateAction: z.string().trim().min(3, "Say what was done immediately."),
  assistanceNeeded: z.string().trim(),
});
export type IncidentValues = z.infer<typeof incidentSchema>;

export const claimSchema = z.object({
  policyId: z.string().min(1, "Choose the insurance policy."),
  claimedAmountRwf: z.string().refine((value) => Number(value) > 0, "Enter the amount you are claiming."),
  notes: z.string().trim().min(5, "Add a few notes for the insurer."),
});
export type ClaimValues = z.infer<typeof claimSchema>;

export const updateSchema = z.object({ text: z.string().trim().min(3, "Write the update first.") });
