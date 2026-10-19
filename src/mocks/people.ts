/** Demonstration drivers, truck profiles and administrator profiles. SAMPLE DATA. */
import { ADMIN_ROLE_PRESETS } from "@/config/permissions";
import type { AdminProfile, Driver, DriverAssignment, TruckProfile } from "@/types/ops";
import { at, day, ref } from "./helpers";

export const drivers: Driver[] = [
  {
    id: "d1", ref: ref("DRV", 1), ownerId: "u-owner", name: "Jean Claude Habimana", phone: "+250 788 120 451",
    email: "jc.habimana@ndayitrans.rw", nationalId: "1198580012345123", licenceNumber: "RW-DL-448201", licenceCategory: "CE",
    licenceExpiry: day(300), status: "ON_TRIP", verification: "APPROVED", assignedTruckId: "truck-u-owner-1",
    joinedAt: at(-420), tripsCompleted: 96, onTimeRate: 94, rating: 4.8,
  },
  {
    id: "d2", ref: ref("DRV", 2), ownerId: "u-owner", name: "Olivier Nsengiyumva", phone: "+250 789 553 902",
    nationalId: "1199280023456231", licenceNumber: "RW-DL-451776", licenceCategory: "C",
    licenceExpiry: day(90), status: "AVAILABLE", verification: "APPROVED", assignedTruckId: "t4",
    joinedAt: at(-300), tripsCompleted: 61, onTimeRate: 91, rating: 4.6,
  },
  {
    id: "d3", ref: ref("DRV", 3), ownerId: "u-owner", name: "Théogène Mugabo", phone: "+250 783 441 067",
    nationalId: "1198780034567342", licenceNumber: "RW-DL-390512", licenceCategory: "CE",
    licenceExpiry: day(12), status: "AVAILABLE", verification: "APPROVED", assignedTruckId: "t6",
    joinedAt: at(-540), tripsCompleted: 133, onTimeRate: 89, rating: 4.5,
  },
  {
    id: "d4", ref: ref("DRV", 4), ownerId: "u-owner", name: "Innocent Bizimana", phone: "+250 722 908 114",
    nationalId: "1199080045678453", licenceNumber: "RW-DL-377260", licenceCategory: "C",
    licenceExpiry: day(-20), status: "OFF_DUTY", verification: "EXPIRED", joinedAt: at(-700),
    tripsCompleted: 74, onTimeRate: 86, rating: 4.2,
  },
  {
    id: "d5", ref: ref("DRV", 5), ownerId: "u-owner-2", name: "Hassan Mwinyi", phone: "+254 722 410 338",
    nationalId: "KE-24418830", licenceNumber: "KE-DL-8821104", licenceCategory: "CE",
    licenceExpiry: day(250), status: "ON_TRIP", verification: "APPROVED", assignedTruckId: "t2",
    joinedAt: at(-380), tripsCompleted: 88, onTimeRate: 95, rating: 4.9,
  },
  {
    id: "d6", ref: ref("DRV", 6), ownerId: "u-owner-2", name: "Salim Juma", phone: "+254 733 204 771",
    nationalId: "KE-30128841", licenceNumber: "KE-DL-7740219", licenceCategory: "CE",
    licenceExpiry: day(400), status: "AVAILABLE", verification: "APPROVED", assignedTruckId: "t3",
    joinedAt: at(-260), tripsCompleted: 52, onTimeRate: 92, rating: 4.7,
  },
  {
    id: "d7", ref: ref("DRV", 7), ownerId: "u-owner-2", name: "Peter Otieno", phone: "+254 711 889 020",
    nationalId: "KE-28810932", licenceNumber: "KE-DL-9910842", licenceCategory: "C",
    licenceExpiry: day(520), status: "OFF_DUTY", verification: "PENDING", joinedAt: at(-6),
    tripsCompleted: 0, onTimeRate: 0, rating: 0,
  },
];

export const driverAssignments: DriverAssignment[] = [
  { id: "da1", driverId: "d1", truckId: "truck-u-owner-1", bookingId: "b6", shipmentId: "sh6", startDate: day(-4), endDate: day(2), status: "ACTIVE", createdAt: at(-6) },
  { id: "da2", driverId: "d5", truckId: "t2", bookingId: "b2", shipmentId: "sh2", startDate: day(-13), endDate: day(-9), status: "ACTIVE", createdAt: at(-15) },
  { id: "da3", driverId: "d6", truckId: "t3", bookingId: "b4", shipmentId: "sh4", startDate: day(-60), endDate: day(-55), status: "COMPLETED", createdAt: at(-62) },
  { id: "da4", driverId: "d2", truckId: "t4", bookingId: "b5", shipmentId: "sh5", startDate: day(-15), endDate: day(-12), status: "COMPLETED", createdAt: at(-17) },
  { id: "da5", driverId: "d7", truckId: "t5", bookingId: "b3", shipmentId: "sh3", startDate: day(-14), endDate: day(-13), status: "COMPLETED", createdAt: at(-16) },
  { id: "da6", driverId: "d3", truckId: "t6", startDate: day(5), endDate: day(9), status: "UPCOMING", createdAt: at(-1) },
];

export const truckProfiles: TruckProfile[] = [
  { truckId: "t1", opsStatus: "RESERVED", lengthM: 12.2, widthM: 2.4, heightM: 2.6, volumeM3: 76, suitability: ["Containers", "General cargo"], verification: "APPROVED", tripsCompleted: 118, onTimeRate: 93, utilizationPct: 71 },
  { truckId: "t2", opsStatus: "IN_TRANSIT", lengthM: 9.8, widthM: 2.4, heightM: 2.5, volumeM3: 58, suitability: ["Perishables", "Pharmaceuticals", "Frozen goods"], verification: "APPROVED", tripsCompleted: 142, onTimeRate: 96, utilizationPct: 82 },
  { truckId: "t3", opsStatus: "AVAILABLE", lengthM: 13.6, widthM: 2.5, heightM: 0, volumeM3: 0, suitability: ["Machinery", "Oversized freight", "Steel"], verification: "APPROVED", tripsCompleted: 97, onTimeRate: 91, utilizationPct: 64 },
  { truckId: "t4", opsStatus: "RESERVED", lengthM: 7.2, widthM: 2.4, heightM: 2.4, volumeM3: 41, suitability: ["Packaged goods", "Retail stock"], verification: "APPROVED", tripsCompleted: 83, onTimeRate: 90, utilizationPct: 58 },
  { truckId: "t5", opsStatus: "RESERVED", lengthM: 13.6, widthM: 2.5, heightM: 2.7, volumeM3: 92, suitability: ["Building materials", "Palletised cargo"], verification: "PENDING", tripsCompleted: 41, onTimeRate: 88, utilizationPct: 47 },
  { truckId: "t6", opsStatus: "AVAILABLE", lengthM: 11.5, widthM: 2.5, heightM: 3.1, volumeM3: 30, suitability: ["Fuel", "Liquid chemicals", "Lubricants"], verification: "EXPIRED", tripsCompleted: 126, onTimeRate: 92, utilizationPct: 76 },
  { truckId: "truck-u-owner-3", opsStatus: "AVAILABLE", lengthM: 13.6, widthM: 2.5, heightM: 0, volumeM3: 0, suitability: ["Machinery", "Steel", "Building materials"], verification: "APPROVED", tripsCompleted: 44, onTimeRate: 92, utilizationPct: 52 },
  { truckId: "truck-u-owner-4", opsStatus: "AVAILABLE", lengthM: 7.2, widthM: 2.4, heightM: 2.4, volumeM3: 41, suitability: ["Packaged goods", "Agricultural bags"], verification: "APPROVED", tripsCompleted: 37, onTimeRate: 90, utilizationPct: 49 },
  { truckId: "truck-u-owner-1", opsStatus: "IN_TRANSIT", lengthM: 12.2, widthM: 2.4, heightM: 2.6, volumeM3: 70, suitability: ["Containers", "Packaged goods"], verification: "APPROVED", tripsCompleted: 58, onTimeRate: 90, utilizationPct: 69 },
];

const adminPermissions = (role: keyof typeof ADMIN_ROLE_PRESETS) => [...ADMIN_ROLE_PRESETS[role].permissions];

export const adminProfiles: AdminProfile[] = [
  { userId: "u-admin", adminRole: "SUPER_ADMIN", permissions: adminPermissions("SUPER_ADMIN") },
  { userId: "u-admin-ops", adminRole: "OPERATIONS", permissions: adminPermissions("OPERATIONS") },
  { userId: "u-admin-fin", adminRole: "FINANCE", permissions: adminPermissions("FINANCE") },
  { userId: "u-admin-sup", adminRole: "SUPPORT", permissions: adminPermissions("SUPPORT") },
];
