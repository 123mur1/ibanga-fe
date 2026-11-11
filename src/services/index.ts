/**
 * Service registry. UI code imports `services` (or the hooks built on it) and never talks to the
 * cache directly. The rules in `./mock/*` run in the browser against the cache in `../mock-db`;
 * `createPersistedServices` saves every change to the API, and some services call the API directly.
 */import type { Services } from "./contracts";
import { apiCargoRequestService, apiQuotationService } from "./api/cargo";
import { apiDriverService } from "./api/drivers";
import { getDocumentFile } from "./api/operations-records";
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

/** Business rules that run in the browser; createPersistedServices saves their changes to the API. */
const localServices: Services = {
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
  return createPersistedServices({
    ...localServices,
    cargoRequests: apiCargoRequestService,
    quotations: apiQuotationService,
    drivers: { ...driverService, ...apiDriverService },
    documents: { ...documentService, getFile: (_actor, id) => getDocumentFile(id) },
  });
}

export const services = createServices();

export type { Services } from "./contracts";
export * from "./types";
