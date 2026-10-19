/**
 * Marketplace data the mock services need to read (trucks, users, bookings).
 *
 * In production the server owns this data and checks it inside each request. In the
 * demonstration, `OpsBridge` copies the current marketplace store here whenever it changes, so
 * mock services can validate things like "does this truck belong to the actor?".
 */
import type { Booking, Truck, User } from "@/lib/types";
import type { Id } from "@/types/ops";

type Directory = { trucks: Truck[]; users: User[]; bookings: Booking[] };

let directory: Directory = { trucks: [], users: [], bookings: [] };

export function setDirectory(next: Directory): void {
  directory = next;
}

export function getDirectory(): Directory {
  return directory;
}

export const findTruck = (id: Id) => directory.trucks.find((truck) => truck.id === id);
export const findUser = (id: Id) => directory.users.find((user) => user.id === id);
export const findBooking = (id: Id) => directory.bookings.find((booking) => booking.id === id);
