import { z } from "zod";

export const TICKET_CATEGORIES = ["ACCOUNT", "BOOKING", "PAYMENT", "SHIPMENT", "TECHNICAL", "OTHER"] as const;
export const TICKET_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export const ticketSchema = z.object({
  subject: z.string().trim().min(5, "Enter a subject of at least 5 characters."),
  category: z.enum(TICKET_CATEGORIES),
  priority: z.enum(TICKET_PRIORITIES),
  relatedRef: z.string().trim().max(60, "Keep the reference under 60 characters.").optional(),
  message: z.string().trim().min(10, "Describe the problem in at least 10 characters."),
});

export const replySchema = z.object({
  text: z.string().trim().min(2, "Write a message first."),
});

export const CATEGORY_LABELS: Record<(typeof TICKET_CATEGORIES)[number], string> = {
  ACCOUNT: "Account and verification",
  BOOKING: "A booking",
  PAYMENT: "Payments and refunds",
  SHIPMENT: "A shipment or delivery",
  TECHNICAL: "Technical problem",
  OTHER: "Something else",
};

export const PRIORITY_LABELS: Record<(typeof TICKET_PRIORITIES)[number], string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};
