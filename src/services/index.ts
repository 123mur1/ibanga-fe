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
import { apiCargoRequestService, apiQuotationService } from "./api/cargo";
import { apiDriverService } from "./api/drivers";
import { createPersistedServices } from "./api/persisted-services";
import { cargoRequestService, quotationService } from "./mock/cargo";
import {
  cancellationService,
  disputeService,
  incidentService,
  supportService,
} from "./mock/cases";
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
    return createPersistedServices({
      ...mockServices,
      cargoRequests: apiCargoRequestService,
      quotations: apiQuotationService,
      drivers: { ...driverService, ...apiDriverService },
    });
  }
  return mockServices;
}

export const services = createServices();

export type { Services } from "./contracts";
export * from "./types";
