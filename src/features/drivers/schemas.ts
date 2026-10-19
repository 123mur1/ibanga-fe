import { z } from "zod";

export const DRIVER_STATUS_VALUES = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"] as const;
export const LICENCE_CATEGORIES = ["B", "C", "CE", "D", "E"] as const;

export const driverSchema = z.object({
  name: z.string().trim().min(2, "Enter the driver's full name."),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{9,15}$/, "Enter a valid phone number, e.g. +250 788 000 000."),
  email: z.string().trim().refine((value) => value === "" || /^\S+@\S+\.\S+$/.test(value), "Enter a valid email address."),
  nationalId: z.string().trim().min(8, "Enter the national ID number (at least 8 characters)."),
  licenceNumber: z.string().trim().min(5, "Enter the licence number."),
  licenceCategory: z.string().min(1, "Choose the licence category."),
  licenceExpiry: z.string().min(1, "Enter the licence expiry date."),
  status: z.enum(DRIVER_STATUS_VALUES),
  assignedTruckId: z.string().optional(),
});

export type DriverFormValues = z.input<typeof driverSchema>;

export const assignmentSchema = z
  .object({
    truckId: z.string().min(1, "Choose a truck."),
    bookingId: z.string().optional(),
    startDate: z.string().min(1, "Choose the start date."),
    endDate: z.string().min(1, "Choose the end date."),
  })
  .refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
    path: ["endDate"],
    message: "The end date cannot be before the start date.",
  });

export type AssignmentFormValues = z.input<typeof assignmentSchema>;
