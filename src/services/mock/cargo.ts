import { truckEligibility } from "@/config/business-rules";
import type { CargoRequestService, QuotationService } from "../contracts";
import type { Actor } from "../types";
import type { CargoRequest, OpsData, Quotation, Shipment } from "@/types/ops";
import { findTruck, findUser } from "./directory";
import {
  audit,
  commit,
  conflict,
  db,
  delay,
  forbid,
  invalid,
  newId,
  nextRef,
  notFound,
  notification,
  nowIso,
  queryList,
  replaceById,
} from "./util";

function validateCargo(input: Partial<CargoRequest>, draft: boolean) {
  const errors: Record<string, string> = {};
  if (!input.title?.trim()) errors.title = "Enter a short title for the cargo.";
  if (draft) {
    if (Object.keys(errors).length)
      invalid("Add a title before saving a draft.", errors);
    return;
  }
  if (!input.description?.trim() || input.description.trim().length < 10)
    errors.description = "Describe the cargo in at least 10 characters.";
  if (!input.pickup?.location?.trim())
    errors.pickupLocation = "Choose the pickup location.";
  if (!input.delivery?.location?.trim())
    errors.deliveryLocation = "Choose the destination.";
  if (!input.pickup?.date) errors.pickupDate = "Choose the pickup date.";
  if (!input.delivery?.date) errors.deliveryDate = "Choose the delivery date.";
  if (
    input.pickup?.date &&
    input.delivery?.date &&
    input.delivery.date < input.pickup.date
  )
    errors.deliveryDate = "Delivery cannot be before pickup.";
  if (!(Number(input.weightTons) > 0))
    errors.weightTons = "Enter a cargo weight above 0 tons.";
  if (!(Number(input.volumeM3) > 0))
    errors.volumeM3 = "Enter a volume above 0 m³.";
  for (const key of ["lengthM", "widthM", "heightM"] as const) {
    if (!(Number(input[key]) > 0)) errors[key] = "Enter a dimension above 0 m.";
  }
  if (!input.truckType) errors.truckType = "Choose the truck type you need.";
  if (!(Number(input.valueRwf) >= 0))
    errors.valueRwf = "Enter the estimated cargo value.";
  if (!input.pickup?.contactName?.trim() || !input.pickup?.contactPhone?.trim())
    errors.pickupContact = "Add a pickup contact name and phone.";
  if (
    !input.delivery?.contactName?.trim() ||
    !input.delivery?.contactPhone?.trim()
  )
    errors.deliveryContact = "Add a destination contact name and phone.";
  if (Object.keys(errors).length)
    invalid("Some required details are missing or invalid.", errors);
}

function visible(actor: Actor, data: OpsData): CargoRequest[] {
  if (actor.role === "ADMIN") return data.cargoRequests;
  if (actor.role === "IMPORTER")
    return data.cargoRequests.filter((item) => item.importerId === actor.id);
  const quotedByMe = new Set(
    data.quotations
      .filter((quote) => quote.ownerId === actor.id)
      .map((quote) => quote.cargoRequestId),
  );
  return data.cargoRequests.filter(
    (item) =>
      item.status === "OPEN" ||
      item.status === "QUOTED" ||
      quotedByMe.has(item.id),
  );
}

function mine(actor: Actor, id: string): CargoRequest {
  const request = db().cargoRequests.find((item) => item.id === id);
  if (!request) notFound("Cargo request");
  if (actor.role !== "ADMIN" && request.importerId !== actor.id) forbid();
  return request;
}

export const cargoRequestService: CargoRequestService = {
  async list(actor, query) {
    await delay(200);
    return queryList(
      visible(actor, db()),
      { sort: { field: "createdAt", direction: "desc" }, ...query },
      (item) =>
        `${item.ref} ${item.title} ${item.pickup.location} ${item.delivery.location} ${item.category}`,
    );
  },

  async get(actor, id) {
    await delay(150);
    const request = visible(actor, db()).find((item) => item.id === id);
    if (!request) notFound("Cargo request");
    return request;
  },

  async create(actor, input, draft) {
    await delay();
    if (actor.role !== "IMPORTER")
      forbid("Only importers can create cargo requests.");
    validateCargo(input, draft);
    const data = db();
    const request: CargoRequest = {
      ...input,
      id: newId("cr"),
      ref: nextRef("CR", data.cargoRequests),
      importerId: actor.id,
      status: draft ? "DRAFT" : "OPEN",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    commit(
      (current) => ({
        ...current,
        cargoRequests: [request, ...current.cargoRequests],
      }),
      {
        audit: [
          audit(
            actor,
            draft ? "Saved draft" : "Published cargo request",
            "Cargo request",
            request.ref,
            request.title,
          ),
        ],
      },
    );
    return request;
  },

  async update(actor, id, patch) {
    await delay();
    const request = mine(actor, id);
    if (!["DRAFT", "OPEN"].includes(request.status)) {
      conflict(
        "Quotations already exist for this request. Cancel it and create a new one to change the cargo.",
      );
    }
    const merged = { ...request, ...patch } as CargoRequest;
    validateCargo(merged, request.status === "DRAFT");
    const updated = { ...merged, updatedAt: nowIso() };
    commit(
      (current) => ({
        ...current,
        cargoRequests: replaceById(current.cargoRequests, id, () => updated),
      }),
      {
        audit: [
          audit(
            actor,
            "Edited cargo request",
            "Cargo request",
            request.ref,
            request.title,
          ),
        ],
      },
    );
    return updated;
  },

  async publishDraft(actor, id) {
    await delay();
    const request = mine(actor, id);
    if (request.status !== "DRAFT") conflict("Only drafts can be published.");
    validateCargo(request, false);
    const updated: CargoRequest = {
      ...request,
      status: "OPEN",
      updatedAt: nowIso(),
    };
    commit(
      (current) => ({
        ...current,
        cargoRequests: replaceById(current.cargoRequests, id, () => updated),
      }),
      {
        audit: [
          audit(
            actor,
            "Published cargo request",
            "Cargo request",
            request.ref,
            request.title,
          ),
        ],
      },
    );
    return updated;
  },

  async cancel(actor, id, reason) {
    await delay();
    const request = mine(actor, id);
    if (!["DRAFT", "OPEN", "QUOTED"].includes(request.status))
      conflict(
        "This request can no longer be cancelled here. Cancel the booking instead.",
      );
    if (!reason.trim())
      invalid("Tell us why you are cancelling.", { reason: "Enter a reason." });
    const updated: CargoRequest = {
      ...request,
      status: "CANCELLED",
      cancelledReason: reason.trim(),
      updatedAt: nowIso(),
    };
    const open = db().quotations.filter(
      (quote) => quote.cargoRequestId === id && quote.status === "SUBMITTED",
    );
    commit(
      (current) => ({
        ...current,
        cargoRequests: replaceById(current.cargoRequests, id, () => updated),
        quotations: current.quotations.map((quote) =>
          quote.cargoRequestId === id && quote.status === "SUBMITTED"
            ? { ...quote, status: "REJECTED", respondedAt: nowIso() }
            : quote,
        ),
      }),
      {
        audit: [
          audit(
            actor,
            "Cancelled cargo request",
            "Cargo request",
            request.ref,
            reason.trim(),
          ),
        ],
        notifications: open.map((quote) =>
          notification(
            quote.ownerId,
            "QUOTATION",
            "Cargo request cancelled",
            `${request.ref} was cancelled by the importer, so your quotation closed.`,
            "/dashboard/owner/opportunities",
          ),
        ),
      },
    );
    return updated;
  },
};

export const quotationService: QuotationService = {
  async listForRequest(actor, cargoRequestId) {
    await delay(200);
    const data = db();
    const request = data.cargoRequests.find(
      (item) => item.id === cargoRequestId,
    );
    if (!request) notFound("Cargo request");
    const quotes = data.quotations.filter(
      (quote) => quote.cargoRequestId === cargoRequestId,
    );
    if (actor.role === "ADMIN") return quotes;
    if (actor.role === "IMPORTER") {
      if (request.importerId !== actor.id) forbid();
      return quotes.filter((quote) => quote.status !== "WITHDRAWN");
    }
    return quotes.filter((quote) => quote.ownerId === actor.id);
  },

  async list(actor, query) {
    await delay(200);
    const data = db();
    const scoped = data.quotations.filter((quote) => {
      if (actor.role === "ADMIN") return true;
      if (actor.role === "TRUCK_OWNER") return quote.ownerId === actor.id;
      const request = data.cargoRequests.find(
        (item) => item.id === quote.cargoRequestId,
      );
      return request?.importerId === actor.id && quote.status !== "WITHDRAWN";
    });
    return queryList(
      scoped,
      { sort: { field: "createdAt", direction: "desc" }, ...query },
      (quote) => `${quote.ref} ${quote.status}`,
    );
  },

  async submit(actor, input) {
    await delay();
    if (actor.role !== "TRUCK_OWNER")
      forbid("Only truck owners can submit quotations.");
    const data = db();
    const request = data.cargoRequests.find(
      (item) => item.id === input.cargoRequestId,
    );
    if (!request) notFound("Cargo request");
    if (!["OPEN", "QUOTED"].includes(request.status))
      conflict("This request is no longer accepting quotations.");
    const truck = findTruck(input.truckId);
    if (!truck || truck.ownerId !== actor.id)
      forbid("Choose one of your own trucks.");
    const errors: Record<string, string> = {};
    if (truck.capacity < request.weightTons)
      errors.truckId = `This truck carries ${truck.capacity} tons but the cargo weighs ${request.weightTons} tons.`;
    if (!(input.amountRwf >= 1000))
      errors.amountRwf = "Enter a price of at least RWF 1,000.";
    if (!input.estimatedPickupDate || !input.estimatedDeliveryDate)
      errors.estimatedDeliveryDate = "Enter pickup and delivery dates.";
    else if (input.estimatedDeliveryDate < input.estimatedPickupDate)
      errors.estimatedDeliveryDate = "Delivery cannot be before pickup.";
    if (Object.keys(errors).length)
      invalid("Check the quotation details.", errors);
    const eligibility = truckEligibility(
      data.truckProfiles.find((profile) => profile.truckId === truck.id),
      data.documents,
    );
    if (!eligibility.eligible)
      invalid(
        `This truck cannot take new work: ${eligibility.reasons.join(" ")}`,
        { truckId: eligibility.reasons[0] },
      );
    if (truck.status !== "AVAILABLE")
      conflict("This truck is already held by a booking.");
    const existing = data.quotations.filter(
      (quote) =>
        quote.cargoRequestId === request.id &&
        ["SUBMITTED", "ACCEPTED"].includes(quote.status),
    );
    if (existing.some((quote) => quote.truckId === truck.id))
      conflict("You already quoted this request with that truck.");
    if (existing.length >= data.settings.maxQuotationsPerRequest)
      conflict("This request already has the maximum number of quotations.");

    const quotation: Quotation = {
      ...input,
      id: newId("q"),
      ref: nextRef("QT", data.quotations),
      ownerId: actor.id,
      status: "SUBMITTED",
      validUntil: new Date(
        Date.now() + data.settings.quotationValidityDays * 86_400_000,
      ).toISOString(),
      createdAt: nowIso(),
    };
    commit(
      (current) => ({
        ...current,
        quotations: [quotation, ...current.quotations],
        cargoRequests: replaceById(current.cargoRequests, request.id, (item) =>
          item.status === "OPEN"
            ? { ...item, status: "QUOTED", updatedAt: nowIso() }
            : item,
        ),
      }),
      {
        audit: [
          audit(
            actor,
            "Submitted quotation",
            "Quotation",
            quotation.ref,
            `${request.ref}: RWF ${quotation.amountRwf.toLocaleString("en-RW")}`,
          ),
        ],
        notifications: [
          notification(
            request.importerId,
            "QUOTATION",
            "New quotation received",
            `${findUser(actor.id)?.company ?? actor.name} quoted RWF ${quotation.amountRwf.toLocaleString("en-RW")} for ${request.ref}.`,
            `/dashboard/importer/cargo-requests/${request.id}`,
          ),
        ],
      },
    );
    return quotation;
  },

  async withdraw(actor, id) {
    await delay();
    const quote = db().quotations.find((item) => item.id === id);
    if (!quote) notFound("Quotation");
    if (actor.role !== "ADMIN" && quote.ownerId !== actor.id) forbid();
    if (quote.status !== "SUBMITTED")
      conflict("Only submitted quotations can be withdrawn.");
    const updated: Quotation = {
      ...quote,
      status: "WITHDRAWN",
      respondedAt: nowIso(),
    };
    commit(
      (current) => {
        const quotations = replaceById(current.quotations, id, () => updated);
        const stillOpen = quotations.some(
          (item) =>
            item.cargoRequestId === quote.cargoRequestId &&
            item.status === "SUBMITTED",
        );
        return {
          ...current,
          quotations,
          cargoRequests: replaceById(
            current.cargoRequests,
            quote.cargoRequestId,
            (item) =>
              item.status === "QUOTED" && !stillOpen
                ? { ...item, status: "OPEN" }
                : item,
          ),
        };
      },
      {
        audit: [audit(actor, "Withdrew quotation", "Quotation", quote.ref, "")],
      },
    );
    return updated;
  },

  async accept(actor, id, bookingId = newId("booking")) {
    await delay();
    const data = db();
    const quote = data.quotations.find((item) => item.id === id);
    if (!quote) notFound("Quotation");
    const request = data.cargoRequests.find(
      (item) => item.id === quote.cargoRequestId,
    );
    if (!request) notFound("Cargo request");
    if (actor.role !== "ADMIN" && request.importerId !== actor.id) forbid();
    if (request.status === "BOOKED" || request.acceptedQuotationId)
      conflict(
        "This request is already booked. No second booking was created.",
      );
    if (quote.status !== "SUBMITTED")
      conflict("This quotation is no longer available.");
    if (new Date(quote.validUntil).getTime() < Date.now())
      invalid("This quotation has expired. Ask the owner for a new one.");

    const accepted: Quotation = {
      ...quote,
      status: "ACCEPTED",
      respondedAt: nowIso(),
    };
    const shipment: Shipment = {
      id: newId("sh"),
      ref: nextRef("SHP", data.shipments),
      bookingId,
      cargoRequestId: request.id,
      ownerId: quote.ownerId,
      importerId: request.importerId,
      truckId: quote.truckId,
      driverId: quote.driverId,
      status: "SCHEDULED",
      etaDate: quote.estimatedDeliveryDate,
      milestones: [],
      createdAt: nowIso(),
    };
    commit(
      (current) => ({
        ...current,
        quotations: current.quotations.map((item) => {
          if (item.id === id) return accepted;
          return item.cargoRequestId === request.id &&
            item.status === "SUBMITTED"
            ? { ...item, status: "REJECTED", respondedAt: nowIso() }
            : item;
        }),
        cargoRequests: replaceById(
          current.cargoRequests,
          request.id,
          (item) => ({
            ...item,
            status: "BOOKED",
            acceptedQuotationId: id,
            bookingId,
            updatedAt: nowIso(),
          }),
        ),
        shipments: [shipment, ...current.shipments],
        notifications: current.notifications,
      }),
      {
        audit: [
          audit(
            actor,
            "Accepted quotation",
            "Quotation",
            quote.ref,
            `${request.ref} booked as ${bookingId}`,
          ),
        ],
        notifications: [
          notification(
            quote.ownerId,
            "BOOKING",
            "Quotation accepted",
            `${request.ref} is booked with your truck. Payment follows from the importer.`,
            `/dashboard/owner/bookings/${bookingId}`,
          ),
          ...data.quotations
            .filter(
              (item) =>
                item.cargoRequestId === request.id &&
                item.status === "SUBMITTED" &&
                item.id !== id,
            )
            .map((item) =>
              notification(
                item.ownerId,
                "QUOTATION",
                "Quotation not selected",
                `The importer chose another quotation for ${request.ref}.`,
                "/dashboard/owner/opportunities",
              ),
            ),
        ],
      },
    );
    return { quotation: accepted, shipment };
  },
};
