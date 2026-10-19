"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { controlClass, FilePicker, FormField } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { Section } from "@/components/common/layout-blocks";
import { GhostButton, PrimaryButton } from "@/components/ui";
import { uploadOrResubmit } from "@/features/owner-fleet/document-upload";
import { useAction } from "@/hooks/use-action";
import { useOps } from "@/hooks/use-ops";
import { useActor } from "@/hooks/use-actor";
import { applyFieldErrors, useZodForm, type PickedFile } from "@/lib/forms";
import { useIbanga } from "@/lib/store";
import { services } from "@/services";
import type { Driver } from "@/types/ops";
import { DRIVER_STATUS_VALUES, LICENCE_CATEGORIES, driverSchema } from "./schemas";
import { statusOf } from "@/config/status";

/** Register a driver (no `driver`) or edit one. The licence file is uploaded as a DRIVER_LICENCE document. */
export function DriverForm({ driver }: { driver?: Driver }) {
  const router = useRouter();
  const actor = useActor();
  const { trucks } = useIbanga();
  const ops = useOps();
  const { run, busy } = useAction();
  const [licenceFiles, setLicenceFiles] = useState<PickedFile[]>([]);
  const myTrucks = trucks.filter((truck) => truck.ownerId === actor?.id);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useZodForm(driverSchema, {
    defaultValues: {
      name: driver?.name ?? "",
      phone: driver?.phone ?? "",
      email: driver?.email ?? "",
      nationalId: driver?.nationalId ?? "",
      licenceNumber: driver?.licenceNumber ?? "",
      licenceCategory: driver?.licenceCategory ?? "",
      licenceExpiry: driver?.licenceExpiry ?? "",
      status: driver?.status ?? "AVAILABLE",
      assignedTruckId: driver?.assignedTruckId ?? "",
    },
  });

  const submit = handleSubmit(async (values) => {
    if (!actor) return;
    const payload = { ...values, email: values.email || undefined, assignedTruckId: values.assignedTruckId || undefined };
    const saved = await run(
      async () => {
        const record = driver ? await services.drivers.update(actor, driver.id, payload) : await services.drivers.create(actor, payload);
        const file = licenceFiles[0];
        if (file) {
          await uploadOrResubmit(
            actor,
            {
              type: "DRIVER_LICENCE",
              subjectKind: "DRIVER",
              subjectId: record.id,
              title: `Driving licence ${values.licenceNumber}`,
              fileName: file.name,
              fileUrl: file.url,
              mimeType: file.mimeType,
              expiryDate: values.licenceExpiry,
            },
            ops.documents,
          );
        }
        return record;
      },
      {
        success: driver ? "Driver details saved." : "Driver registered. Submit documents for verification before assigning work.",
        onError: (_error, fields) => applyFieldErrors(setError, fields),
      },
    );
    if (saved) router.push(`/dashboard/owner/drivers/${saved.id}`);
  });

  const back = driver ? `/dashboard/owner/drivers/${driver.id}` : "/dashboard/owner/drivers";

  return (
    <form onSubmit={submit} noValidate className="mt-6 space-y-5">
      <Section title="Personal details">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full name" required error={errors.name?.message}>
            <input className={controlClass} autoComplete="off" aria-invalid={Boolean(errors.name)} {...register("name")} />
          </FormField>
          <FormField label="Phone" required error={errors.phone?.message}>
            <input className={controlClass} type="tel" aria-invalid={Boolean(errors.phone)} {...register("phone")} />
          </FormField>
          <FormField label="Email" error={errors.email?.message} hint="Optional.">
            <input className={controlClass} type="email" aria-invalid={Boolean(errors.email)} {...register("email")} />
          </FormField>
          <FormField label="National ID number" required error={errors.nationalId?.message} hint="Enter the driver&apos;s national ID number.">
            <input className={controlClass} autoComplete="off" aria-invalid={Boolean(errors.nationalId)} {...register("nationalId")} />
          </FormField>
        </div>
      </Section>

      <Section title="Driving licence" description="Expired licences make a driver ineligible for assignments.">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Licence number" required error={errors.licenceNumber?.message}>
            <input className={controlClass} autoComplete="off" aria-invalid={Boolean(errors.licenceNumber)} {...register("licenceNumber")} />
          </FormField>
          <FormField label="Category" required error={errors.licenceCategory?.message}>
            <select className={controlClass} aria-invalid={Boolean(errors.licenceCategory)} {...register("licenceCategory")}>
              <option value="">Choose category</option>
              {LICENCE_CATEGORIES.map((category) => <option key={category} value={category}>Category {category}</option>)}
            </select>
          </FormField>
          <FormField label="Expiry date" required error={errors.licenceExpiry?.message}>
            <input className={controlClass} type="date" aria-invalid={Boolean(errors.licenceExpiry)} {...register("licenceExpiry")} />
          </FormField>
        </div>
        <div className="mt-4">
          <FilePicker label={driver ? "Upload a new licence document (optional)" : "Licence document"} files={licenceFiles} onChange={setLicenceFiles} />
          <p className="mt-2 text-xs text-muted">The document starts as pending review. An administrator verifies it, and only then is the driver approved.</p>
        </div>
      </Section>

      <Section title="Availability and truck">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Availability status" error={errors.status?.message}>
            <select className={controlClass} {...register("status")}>
              {DRIVER_STATUS_VALUES.map((status) => <option key={status} value={status}>{statusOf("driver", status).label}</option>)}
            </select>
          </FormField>
          <FormField label="Usual truck" error={errors.assignedTruckId?.message} hint="Dated trip assignments are made from the driver page.">
            <select className={controlClass} {...register("assignedTruckId")}>
              <option value="">No usual truck</option>
              {myTrucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.plateNumber} · {truck.truckType}</option>)}
            </select>
          </FormField>
        </div>
        {driver?.verification && driver.verification !== "APPROVED" ? (
          <div className="mt-4"><Notice tone="warning" title="Not verified yet">Verification status is “{statusOf("verification", driver.verification).label}”. The driver cannot be assigned until approved.</Notice></div>
        ) : null}
      </Section>

      <div className="flex flex-wrap gap-3">
        <PrimaryButton type="submit" disabled={busy || !actor}>{busy ? "Saving…" : driver ? "Save changes" : "Register driver"}</PrimaryButton>
        <GhostButton type="button" disabled={busy} onClick={() => router.push(back)}>Cancel</GhostButton>
      </div>
    </form>
  );
}
