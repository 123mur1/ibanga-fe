"use client";

import { useState } from "react";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { Section } from "@/components/common/layout-blocks";
import { PrimaryButton } from "@/components/ui";
import { driverEligibility, feeBreakdown, truckEligibility } from "@/config/business-rules";
import { useActor } from "@/hooks/use-actor";
import { useAction } from "@/hooks/use-action";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { formatRwf, formatTons } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { CargoRequest, Quotation } from "@/types/ops";
import { quotationSchema } from "./schemas";

export function QuotationForm({ request, myQuotations }: { request: CargoRequest; myQuotations: Quotation[] }) {
  const actor = useActor();
  const { trucks } = useIbanga();
  const ops = useOps();
  const { run, busy } = useAction();
  const [sentRef, setSentRef] = useState<string | null>(null);
  const drivers = useServiceQuery(() => services.drivers.list(actor!, { pageSize: 200 }), [actor?.id]);

  const myTrucks = trucks.filter((truck) => truck.ownerId === actor?.id);
  const {
    register,
    handleSubmit,
    watch,
    setError,
    reset,
    formState: { errors },
  } = useZodForm(quotationSchema, {
    defaultValues: {
      truckId: "",
      driverId: "",
      amountRwf: undefined,
      estimatedPickupDate: request.pickup.date,
      estimatedDeliveryDate: request.delivery.date,
      notes: "",
    },
  });

  const truckId = watch("truckId");
  const driverId = watch("driverId");
  const amount = watch("amountRwf");
  const truck = myTrucks.find((item) => item.id === truckId);
  const driver = drivers.data?.items.find((item) => item.id === driverId);

  const truckCheck = truck ? truckEligibility(ops.truckProfiles.find((profile) => profile.truckId === truck.id), ops.documents) : undefined;
  const tooSmall = truck ? truck.capacity < request.weightTons : false;
  const alreadyQuoted = truck ? myQuotations.some((quote) => quote.truckId === truck.id && ["SUBMITTED", "ACCEPTED"].includes(quote.status)) : false;
  const held = truck ? truck.status !== "AVAILABLE" : false;
  const driverCheck = driver ? driverEligibility(driver, ops.documents) : undefined;
  const blocked = Boolean(truck && (!truckCheck?.eligible || tooSmall || alreadyQuoted || held)) || Boolean(driverCheck && !driverCheck.eligible);
  const fee = Number.isFinite(amount) && amount > 0 ? feeBreakdown(amount) : undefined;

  const submit = handleSubmit(async (values) => {
    if (!actor || blocked) return;
    const saved = await run(
      () =>
        services.quotations.submit(actor, {
          cargoRequestId: request.id,
          truckId: values.truckId,
          driverId: values.driverId || undefined,
          amountRwf: values.amountRwf,
          estimatedPickupDate: values.estimatedPickupDate,
          estimatedDeliveryDate: values.estimatedDeliveryDate,
          notes: values.notes,
        }),
      { success: "Quotation sent. It is an offer only; no booking exists yet.", onError: (_error, fields) => applyFieldErrors(setError, fields) },
    );
    if (saved) {
      setSentRef(saved.ref);
      reset();
    }
  });

  return (
    <Section title="Send a quotation" description="Your price is an offer. The importer decides whether to accept it.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {sentRef ? <Notice tone="success" title={`Quotation ${sentRef} sent`}>The importer was notified. If they accept, a booking is created and appears in your bookings.</Notice> : null}

        <FormField label="Truck" required error={errors.truckId?.message}>
          <select className={controlClass} aria-invalid={Boolean(errors.truckId)} {...register("truckId")}>
            <option value="">Choose one of your trucks</option>
            {myTrucks.map((item) => (
              <option key={item.id} value={item.id}>{item.plateNumber} · {item.truckType} · {item.capacity} t</option>
            ))}
          </select>
        </FormField>
        {myTrucks.length === 0 ? <Notice tone="warning" title="You have no trucks">Add a truck before quoting.</Notice> : null}
        {truck ? (
          <div className="space-y-2" aria-live="polite">
            <p className="text-sm text-navy">
              Capacity <strong>{formatTons(truck.capacity)}</strong> against cargo <strong>{formatTons(request.weightTons)}</strong>.{" "}
              {tooSmall ? <span className="font-semibold text-bad">Too small for this cargo.</span> : <span className="font-semibold text-good">Capacity is enough.</span>}
            </p>
            {truckCheck && !truckCheck.eligible ? (
              <Notice tone="danger" title="This truck cannot take new work">
                <ul className="list-disc pl-5">{truckCheck.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                Fix this on the truck page before quoting.
              </Notice>
            ) : truckCheck ? (
              <Notice tone="success" title="Truck is eligible">Verified, in service, and its required documents are valid.</Notice>
            ) : null}
            {alreadyQuoted ? <Notice tone="warning" title="Already quoted">You have an active quotation for this request with this truck. Withdraw it first to send a new one.</Notice> : null}
            {held ? <Notice tone="warning" title="Truck is paused or held">This truck is unavailable on the marketplace, so it cannot be quoted right now.</Notice> : null}
          </div>
        ) : null}

        <FormField label="Driver (optional)" error={errors.driverId?.message} hint="You can assign or change the driver after the quotation is accepted.">
          <select className={controlClass} {...register("driverId")}>
            <option value="">Decide later</option>
            {(drivers.data?.items ?? []).map((item) => (
              <option key={item.id} value={item.id}>{item.name} · licence {item.licenceCategory}</option>
            ))}
          </select>
        </FormField>
        {driverCheck && !driverCheck.eligible ? (
          <Notice tone="danger" title="This driver cannot be assigned">
            <ul className="list-disc pl-5">{driverCheck.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            Choose another driver, or leave the driver for later.
          </Notice>
        ) : null}

        <FormField label="Your price (RWF)" required error={errors.amountRwf?.message} hint={request.budgetRwf ? `Importer budget: ${formatRwf(request.budgetRwf)}.` : "The importer did not state a budget."}>
          <input className={controlClass} type="number" inputMode="numeric" min={0} step={1000} aria-invalid={Boolean(errors.amountRwf)} {...register("amountRwf", { valueAsNumber: true })} />
        </FormField>
        {fee ? (
          <p className="rounded-lg bg-background px-3 py-2 text-sm text-muted">
            If accepted, an estimated platform fee of {formatRwf(fee.platformFeeRwf)} applies and you would receive about <strong className="text-navy">{formatRwf(fee.ownerNetRwf)}</strong> after delivery is verified.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Estimated pickup date" required error={errors.estimatedPickupDate?.message}>
            <input className={controlClass} type="date" aria-invalid={Boolean(errors.estimatedPickupDate)} {...register("estimatedPickupDate")} />
          </FormField>
          <FormField label="Estimated delivery date" required error={errors.estimatedDeliveryDate?.message}>
            <input className={controlClass} type="date" aria-invalid={Boolean(errors.estimatedDeliveryDate)} {...register("estimatedDeliveryDate")} />
          </FormField>
        </div>

        <FormField label="Notes for the importer" error={errors.notes?.message} hint="Truck condition, loading equipment, departure time.">
          <textarea className={`${controlClass} min-h-24 resize-y`} {...register("notes")} />
        </FormField>

        <PrimaryButton type="submit" disabled={busy || blocked || !actor} className="w-full sm:w-auto">
          {busy ? "Sending…" : blocked ? "Resolve the warnings to quote" : "Send quotation"}
        </PrimaryButton>
      </form>
    </Section>
  );
}
