/**
 * Service registry. UI code imports `services` (or the hooks built on it) and never talks to the
 * mock database directly.
 *
 * Switching to a real backend: write HTTP implementations of the interfaces in `./contracts.ts`
 * (for example `./api/cargo-requests.ts`), return them here when `env.dataSource === "api"`, and
 * keep `ServiceError` as the error type so screens keep working. The mock implementations live in
 * `./mock/*` and are the only code that reads `mockDb`.
 */
import { env } from "@/config/env";
import type { Services } from "./contracts";
import { cargoRequestService, quotationService } from "./mock/cargo";
import { cancellationService, disputeService, incidentService, supportService } from "./mock/cases";
import { documentService } from "./mock/documents";
import { driverService, truckOpsService } from "./mock/drivers";
import { adminService, notificationService } from "./mock/platform";
import { settlementService, shipmentService } from "./mock/shipments";

const mockServices: Services = {
  cargoRequests: cargoRequestService,
  quotations: quotationService,
  drivers: driverService,
  trucks: truckOpsService,
  shipments: shipmentService,
  settlements: settlementService,
  documents: documentService,
  cancellations: cancellationService,
  disputes: disputeService,
  incidents: incidentService,
  support: supportService,
  notifications: notificationService,
  admin: adminService,
};

function createServices(): Services {
  if (env.dataSource === "api") {
    // Not implemented in this frontend-only phase. Fall back to mocks so the app still runs.
    console.warn("NEXT_PUBLIC_OPS_DATA_SOURCE=api is set but no API services exist yet. Using demonstration data.");
  }
  return mockServices;
}

export const services = createServices();

export type { Services } from "./contracts";
export * from "./types";
