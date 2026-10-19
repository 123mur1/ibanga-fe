"use client";

import { controlClass, FormField } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { Section } from "@/components/common/layout-blocks";
import { PrimaryButton } from "@/components/ui";
import { driverEligibility, truckEligibility } from "@/config/business-rules";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useOps } from "@/hooks/use-ops";
import { useServiceQuery } from "@/hooks/use-service-query";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { formatDate } from "@/lib/format";
import { useIbanga } from "@/lib/store";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/types";
import { services } from "@/services";
import type { Driver } from "@/types/ops";
import { assignmentSchema } from "./schemas";

/** Assign a driver to a truck for a date range, with live conflict and eligibility checks. */
export function AssignForm({ driver }: { driver: Driver }) {
  const actor = useActor();
  const ops = useOps();
  const { trucks, bookings } = useIbanga();
  const { run, busy } = useAction();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    reset,
    formState: { errors },
  } = useZodForm(assignmentSchema, {
    defaultValues: { truckId: driver.assignedTruckId ?? "", bookingId: "", startDate: "", endDate: "" },
  });

  const myTrucks = trucks.filter((truck) => truck.ownerId === actor?.id);
  const myBookings = bookings.filter((booking) => ACTIVE_BOOKING_STATUSES.includes(booking.status) && myTrucks.some((truck) => truck.id === booking.truckId));
  const [truckId, bookingId, startDate, endDate] = watch(["truckId", "bookingId", "startDate", "endDate"]);
  const datesOk = Boolean(startDate && endDate && endDate >= startDate);

  const conflicts = useServiceQuery(
    () => (truckId && datesOk ? services.drivers.findConflicts({ driverId: driver.id, truckId, startDate, endDate }) : Promise.resolve([])),
    [driver.id, truckId, startDate, endDate, datesOk],
  );

  const truckCheck = truckId ? truckEligibility(ops.truckProfiles.find((profile) => profile.truckId === truckId), ops.documents) : undefined;
  const driverCheck = driverEligibility(driver, ops.documents);
  const clashes = conflicts.data ?? [];
  const blocked = !driverCheck.eligible || Boolean(truckCheck && !truckCheck.eligible) || clashes.length > 0;

  const submit = handleSubmit(async (values) => {
    if (!actor || blocked) return;
    const shipment = values.bookingId ? ops.shipments.find((item) => item.bookingId === values.bookingId) : undefined;
    const saved = await run(
      () =>
        services.drivers.assign(actor, {
          driverId: driver.id,
          truckId: values.truckId,
          bookingId: values.bookingId || undefined,
          shipmentId: shipment?.id,
          startDate: values.startDate,
          endDate: values.endDate,
        }),
      { success: `${driver.name} assigned.`, onError: (_error, fields) => applyFieldErrors(setError, fields) },
    );
    if (saved) reset({ truckId: values.truckId, bookingId: "", startDate: "", endDate: "" });
  });

  return (
    <Section title="Assign to a truck" description="Choose a truck and dates. Overlaps with other assignments are checked as you type.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {!driverCheck.eligible ? (
          <Notice tone="danger" title="This driver cannot be assigned">
            <ul className="list-disc pl-5">{driverCheck.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          </Notice>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Truck" required error={errors.truckId?.message}>
            <select className={controlClass} aria-invalid={Boolean(errors.truckId)} {...register("truckId")}>
              <option value="">Choose a truck</option>
              {myTrucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.plateNumber} · {truck.truckType}</option>)}
            </select>
          </FormField>
          <FormField label="Booking (optional)" hint="Link the assignment to one of your active bookings.">
            <select className={controlClass} {...register("bookingId")}>
              <option value="">Not linked to a booking</option>
              {myBookings.map((booking) => (
                <option key={booking.id} value={booking.id}>{booking.pickupLocation} to {booking.destination} ({formatDate(booking.pickupDate)})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Start date" required error={errors.startDate?.message}>
            <input className={controlClass} type="date" aria-invalid={Boolean(errors.startDate)} {...register("startDate")} />
          </FormField>
          <FormField label="End date" required error={errors.endDate?.message}>
            <input className={controlClass} type="date" aria-invalid={Boolean(errors.endDate)} {...register("endDate")} />
          </FormField>
        </div>
        {bookingId && !ops.shipments.some((item) => item.bookingId === bookingId) ? (
          <Notice title="No shipment yet">This booking has no shipment record, so only the booking will be linked.</Notice>
        ) : null}
        {truckCheck && !truckCheck.eligible ? (
          <Notice tone="danger" title="This truck cannot take work">
            <ul className="list-disc pl-5">{truckCheck.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
          </Notice>
        ) : null}
        {clashes.length > 0 ? (
          <Notice tone="danger" title="Scheduling conflict">
            The driver or truck already has {clashes.length === 1 ? "an assignment" : `${clashes.length} assignments`} on these dates:{" "}
            {clashes.map((item) => `${formatDate(item.startDate)} to ${formatDate(item.endDate)}`).join("; ")}. Choose different dates or another truck.
          </Notice>
        ) : datesOk && truckId && conflicts.data ? (
          <Notice tone="success" title="No conflicts">Neither the driver nor the truck has another assignment on these dates.</Notice>
        ) : null}
        <PrimaryButton type="submit" disabled={busy || blocked || !actor}>{busy ? "Assigning…" : "Assign driver"}</PrimaryButton>
      </form>
    </Section>
  );
}
