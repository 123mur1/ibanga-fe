import { z } from "zod";

export const companyProfileSchema = z.object({
  company: z.string().trim().min(2, "Enter your company name."),
  phone: z.string().trim().min(7, "Enter a phone number we can reach."),
  location: z.string().trim().min(2, "Enter your location."),
});
