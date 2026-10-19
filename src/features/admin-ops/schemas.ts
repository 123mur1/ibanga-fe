import { z } from "zod";

export const MILESTONE_KINDS = ["PICKUP_CONFIRMED", "LOADED", "DEPARTED", "IN_TRANSIT_UPDATE", "ARRIVED", "UNLOADING"] as const;

/** Delivery and delay are excluded: delivery needs evidence, delay has its own form for the owner. */
export const milestoneSchema = z.object({
  kind: z.enum(MILESTONE_KINDS),
  place: z.string().trim().min(2, "Enter where the truck is."),
  note: z.string().trim().max(300, "Keep the note under 300 characters."),
});
export type MilestoneValues = z.infer<typeof milestoneSchema>;

export const timelineSchema = z.object({
  text: z.string().trim().min(3, "Write at least 3 characters.").max(500, "Keep the entry under 500 characters."),
});
export type TimelineValues = z.infer<typeof timelineSchema>;

export const INCIDENT_STATUSES = ["REPORTED", "UNDER_INVESTIGATION", "CLAIM_FILED", "RESOLVED", "CLOSED"] as const;

/** A resolution is required to resolve or close an incident. */
export const incidentStatusSchema = z
  .object({
    status: z.enum(INCIDENT_STATUSES),
    resolution: z.string().trim().max(800, "Keep the resolution under 800 characters."),
    responsibleParty: z.string().trim().max(120, "Keep this under 120 characters."),
  })
  .superRefine((value, context) => {
    if ((value.status === "RESOLVED" || value.status === "CLOSED") && value.resolution.length < 5) {
      context.addIssue({ code: "custom", path: ["resolution"], message: "A resolution is required to resolve or close an incident." });
    }
  });
export type IncidentStatusValues = z.infer<typeof incidentStatusSchema>;
