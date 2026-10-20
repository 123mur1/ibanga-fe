import { driverEligibility, truckEligibility } from "@/config/business-rules";
import type { Driver, DriverAssignment, OpsData, TruckProfile } from "@/types/ops";
import type { AssignmentInput, DriverService, TruckOpsService } from "../contracts";
import type { Actor } from "../types";
import { findTruck, findUser } from "./directory";
import { audit, commit, conflict, db, delay, forbid, invalid, newId, nextRef, notFound, notification, nowIso, queryList, replaceById } from "./util";

const today = () => new Date().toISOString().slice(0, 10);

function ownDriver(actor: Actor, id: string): Driver {
  const driver = db().drivers.find((item) => actor.role === "DRIVER" ? item.userId === actor.id : item.id === id);
  if (!driver) notFound("Driver");
  if (actor.role === "DRIVER" && driver.userId !== actor.id) forbid("This driver account is not yours.");
  if (actor.role !== "ADMIN" && actor.role !== "DRIVER" && driver.ownerId !== actor.id) forbid("This driver belongs to another owner.");
  return driver;
}

function overlaps(a: { startDate: string; endDate: string }, b: { startDate: string; endDate: string }) {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

function conflictsFor(data: OpsData, input: AssignmentInput, ignoreId?: string): DriverAssignment[] {
  return data.driverAssignments.filter(
    (item) =>
      item.id !== ignoreId &&
      ["UPCOMING", "ACTIVE"].includes(item.status) &&
      (item.driverId === input.driverId || item.truckId === input.truckId) &&
      overlaps(item, input),
  );
}

function assignmentStatus(input: { startDate: string; endDate: string }): DriverAssignment["status"] {
  return input.startDate <= today() && input.endDate >= today() ? "ACTIVE" : "UPCOMING";
}

export const driverService: DriverService = {
  async list(actor, query) {
    await delay(200);
    const scoped = db().drivers.filter((driver) => actor.role === "ADMIN" || (actor.role === "DRIVER" ? driver.userId === actor.id : driver.ownerId === actor.id));
    return queryList(scoped, { sort: { field: "name", direction: "asc" }, ...query }, (driver) => `${driver.ref} ${driver.name} ${driver.phone} ${driver.licenceNumber}`);
  },

  async get(actor, id) {
    await delay(120);
    return ownDriver(actor, id);
  },

  async create(actor, input) {
    await delay();
    if (actor.role !== "TRUCK_OWNER" && actor.role !== "ADMIN") forbid();
    const errors: Record<string, string> = {};
    if (!input.name.trim()) errors.name = "Enter the driver's full name.";
    if (!input.phone.trim()) errors.phone = "Enter a phone number.";
    if (!input.licenceNumber.trim()) errors.licenceNumber = "Enter the licence number.";
    if (!input.licenceExpiry) errors.licenceExpiry = "Enter the licence expiry date.";
    if (!input.nationalId.trim()) errors.nationalId = "Enter the national ID number.";
    if (!input.email.trim()) errors.email = "Enter the driver's account email.";
    if (!input.userId) errors.userId = "Create a driver sign-in account.";
    if (!input.assignedTruckId) errors.assignedTruckId = "Associate the driver with a truck.";
    if (input.userId && findUser(input.userId)?.role !== "DRIVER") errors.userId = "Create a driver sign-in account.";
    if (Object.keys(errors).length) invalid("Some driver details are missing.", errors);
    const data = db();
    const ownerId = actor.role === "ADMIN" ? input.ownerId : actor.id;
    if (!ownerId || findUser(ownerId)?.role !== "TRUCK_OWNER") {
      invalid("Choose a registered truck owner for this driver.", { ownerId: "Choose a truck owner." });
    }
    if (input.assignedTruckId && findTruck(input.assignedTruckId)?.ownerId !== ownerId) {
      invalid("Choose a truck that belongs to this driver's owner.", { assignedTruckId: "Choose one of this owner's trucks." });
    }
    if (data.drivers.some((driver) => driver.userId === input.userId)) conflict("This sign-in account is already linked to a driver.");
    if (data.drivers.some((driver) => driver.licenceNumber.toLowerCase() === input.licenceNumber.trim().toLowerCase())) {
      conflict("A driver with this licence number is already registered.");
    }
    const driver: Driver = {
      ...input,
      id: newId("d"),
      ref: nextRef("DRV", data.drivers),
      ownerId,
      verification: "NOT_SUBMITTED",
      joinedAt: nowIso(),
      tripsCompleted: 0,
      onTimeRate: 0,
      rating: 0,
    };
    commit((current) => ({ ...current, drivers: [driver, ...current.drivers] }), {
      audit: [audit(actor, "Registered driver", "Driver", driver.ref, driver.name)],
    });
    return driver;
  },

  async update(actor, id, patch) {
    await delay();
    const driver = ownDriver(actor, id);
    if (actor.role === "DRIVER") forbid("Drivers cannot edit their compliance profile.");
    if (!patch.assignedTruckId && !driver.assignedTruckId) invalid("Associate the driver with a truck.", { assignedTruckId: "Choose a truck." });
    if (patch.assignedTruckId && findTruck(patch.assignedTruckId)?.ownerId !== driver.ownerId) invalid("Choose a truck that belongs to this driver's owner.", { assignedTruckId: "Choose one of this owner's trucks." });
    const updated = { ...driver, ...patch, ownerId: driver.ownerId, userId: driver.userId };
    commit((current) => ({ ...current, drivers: replaceById(current.drivers, id, () => updated) }), {
      audit: [audit(actor, "Edited driver", "Driver", driver.ref, driver.name)],
    });
    return updated;
  },

  async setStatus(actor, id, status) {
    await delay(200);
    const driver = ownDriver(actor, id);
    if (actor.role === "DRIVER") forbid("Drivers cannot change their own status.");
    if (driver.status === "ON_TRIP" && status !== "ON_TRIP") conflict("This driver is on an active trip. Reassign the trip first.");
    const updated = { ...driver, status };
    commit((current) => ({ ...current, drivers: replaceById(current.drivers, id, () => updated) }), {
      audit: [audit(actor, "Changed driver status", "Driver", driver.ref, status)],
    });
    return updated;
  },

  async listAssignments(actor, filter) {
    await delay(150);
    const data = db();
    return data.driverAssignments.filter((item) => {
      const driver = data.drivers.find((candidate) => candidate.id === item.driverId);
      if (actor.role === "DRIVER" ? driver?.userId !== actor.id : actor.role !== "ADMIN" && driver?.ownerId !== actor.id) return false;
      return (!filter?.driverId || item.driverId === filter.driverId)
        && (!filter?.truckId || item.truckId === filter.truckId)
        && (!filter?.status || item.status === filter.status);
    });
  },

  async findConflicts(input, ignoreAssignmentId) {
    return conflictsFor(db(), input, ignoreAssignmentId);
  },

  async assign(actor, input) {
    await delay();
    if (actor.role === "DRIVER") forbid("Only truck owners and administrators can assign drivers.");
    const data = db();
    const driver = ownDriver(actor, input.driverId);
    const truck = findTruck(input.truckId);
    if (!truck) notFound("Truck");
    if (truck.ownerId !== driver.ownerId) forbid("Choose a truck that belongs to this driver's owner.");
    if (actor.role !== "ADMIN" && truck.ownerId !== actor.id) forbid("Choose one of your own trucks.");
    if (input.endDate < input.startDate) invalid("The end date cannot be before the start date.", { endDate: "End date is before start date." });
    const driverCheck = driverEligibility(driver, data.documents);
    if (!driverCheck.eligible) invalid(`This driver cannot be assigned: ${driverCheck.reasons.join(" ")}`, { driverId: driverCheck.reasons[0] });
    const truckCheck = truckEligibility(data.truckProfiles.find((profile) => profile.truckId === truck.id), data.documents);
    if (!truckCheck.eligible) invalid(`This truck cannot take work: ${truckCheck.reasons.join(" ")}`, { truckId: truckCheck.reasons[0] });
    const clashes = conflictsFor(data, input);
    if (clashes.length) conflict("This driver or truck already has an assignment on those dates.");

    const status = assignmentStatus(input);
    const assignment: DriverAssignment = { ...input, id: newId("da"), status, createdAt: nowIso() };
    commit(
      (current) => ({
        ...current,
        driverAssignments: [assignment, ...current.driverAssignments],
        drivers: replaceById(current.drivers, driver.id, (item) => ({ ...item, assignedTruckId: truck.id, status: status === "ACTIVE" ? "ON_TRIP" : item.status })),
        shipments: input.shipmentId ? replaceById(current.shipments, input.shipmentId, (item) => ({ ...item, driverId: driver.id })) : current.shipments,
      }),
      { audit: [audit(actor, "Assigned driver", "Assignment", assignment.id, `${driver.name} to ${truck.plateNumber}`)] },
    );
    return assignment;
  },

  async reassign(actor, assignmentId, newDriverId) {
    await delay();
    if (actor.role === "DRIVER") forbid("Only truck owners and administrators can change driver assignments.");
    const data = db();
    const assignment = data.driverAssignments.find((item) => item.id === assignmentId);
    if (!assignment) notFound("Assignment");
    const oldDriver = ownDriver(actor, assignment.driverId);
    const newDriver = ownDriver(actor, newDriverId);
    if (newDriver.id === oldDriver.id) invalid("Choose a different driver.");
    if (newDriver.ownerId !== oldDriver.ownerId) forbid("Choose a replacement driver from the same truck owner.");
    const check = driverEligibility(newDriver, data.documents);
    if (!check.eligible) invalid(`This driver cannot be assigned: ${check.reasons.join(" ")}`);
    if (conflictsFor(data, { ...assignment, driverId: newDriver.id }, assignment.id).some((item) => item.driverId === newDriver.id)) {
      conflict("The new driver already has an assignment on those dates.");
    }
    const updated: DriverAssignment = { ...assignment, driverId: newDriver.id, replacedDriverId: oldDriver.id };
    commit(
      (current) => ({
        ...current,
        driverAssignments: replaceById(current.driverAssignments, assignmentId, () => updated),
        drivers: current.drivers.map((item) => {
          if (item.id === oldDriver.id) return { ...item, status: "AVAILABLE" };
          if (item.id === newDriver.id) return { ...item, status: assignment.status === "ACTIVE" ? "ON_TRIP" : item.status, assignedTruckId: assignment.truckId };
          return item;
        }),
        shipments: assignment.shipmentId ? replaceById(current.shipments, assignment.shipmentId, (item) => ({ ...item, driverId: newDriver.id })) : current.shipments,
      }),
      {
        audit: [audit(actor, "Changed driver assignment", "Assignment", assignmentId, `${oldDriver.name} replaced by ${newDriver.name}`)],
        notifications: assignment.shipmentId
          ? data.shipments.filter((item) => item.id === assignment.shipmentId).map((item) =>
              notification(item.importerId, "SHIPMENT", "Driver changed", `The driver for ${item.ref} changed to ${newDriver.name}.`, `/dashboard/importer/shipments/${item.id}`))
          : [],
      },
    );
    return updated;
  },

  async cancelAssignment(actor, assignmentId) {
    await delay(200);
    if (actor.role === "DRIVER") forbid("Only truck owners and administrators can cancel driver assignments.");
    const assignment = db().driverAssignments.find((item) => item.id === assignmentId);
    if (!assignment) notFound("Assignment");
    ownDriver(actor, assignment.driverId);
    if (assignment.status === "COMPLETED") conflict("Completed assignments cannot be cancelled.");
    const updated: DriverAssignment = { ...assignment, status: "CANCELLED" };
    commit(
      (current) => ({
        ...current,
        driverAssignments: replaceById(current.driverAssignments, assignmentId, () => updated),
        drivers: replaceById(current.drivers, assignment.driverId, (item) => (item.status === "ON_TRIP" ? { ...item, status: "AVAILABLE" } : item)),
      }),
      { audit: [audit(actor, "Cancelled assignment", "Assignment", assignmentId, "")] },
    );
    return updated;
  },
};

export const truckOpsService: TruckOpsService = {
  async getProfile(truckId) {
    await delay(80);
    return db().truckProfiles.find((profile) => profile.truckId === truckId);
  },

  async listProfiles(actor) {
    await delay(120);
    const data = db();
    return data.truckProfiles.filter((profile) => actor.role === "ADMIN" || findTruck(profile.truckId)?.ownerId === actor.id);
  },

  async updateProfile(actor, truckId, patch) {
    await delay();
    const truck = findTruck(truckId);
    if (!truck) notFound("Truck");
    if (actor.role !== "ADMIN" && truck.ownerId !== actor.id) forbid();
    const existing = db().truckProfiles.find((profile) => profile.truckId === truckId);
    const base: TruckProfile = existing ?? {
      truckId, opsStatus: truck.status === "AVAILABLE" ? "AVAILABLE" : "RESERVED", lengthM: 0, widthM: 0, heightM: 0, volumeM3: 0,
      suitability: [], verification: "NOT_SUBMITTED", tripsCompleted: 0, onTimeRate: 0, utilizationPct: 0,
    };
    const next = { ...base, ...patch, truckId };
    commit(
      (current) => ({
        ...current,
        truckProfiles: existing
          ? current.truckProfiles.map((profile) => (profile.truckId === truckId ? next : profile))
          : [...current.truckProfiles, next],
      }),
      { audit: [audit(actor, "Updated truck profile", "Truck", truck.plateNumber, "")] },
    );
    return next;
  },

  async setOpsStatus(actor, truckId, status) {
    return truckOpsService.updateProfile(actor, truckId, { opsStatus: status });
  },
};
