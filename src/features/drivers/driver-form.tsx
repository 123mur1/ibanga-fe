"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FilePicker } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { Field, GhostButton, inputClass, Modal, PrimaryButton } from "@/components/ui";
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
  const { trucks, users, addUser, deleteUser } = useIbanga();
  const ops = useOps();
  const { run, busy } = useAction();
  const [licenceFiles, setLicenceFiles] = useState<PickedFile[]>([]);
  const myTrucks = trucks.filter((truck) => truck.ownerId === actor?.id);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useZodForm(driverSchema, {
    defaultValues: {
      name: driver?.name ?? "",
      phone: driver?.phone ?? "",
      email: driver?.email ?? "",
      password: "",
      nationalId: driver?.nationalId ?? "",
      licenceNumber: driver?.licenceNumber ?? "",
      licenceCategory: driver?.licenceCategory ?? "",
      licenceExpiry: driver?.licenceExpiry ?? "",
      status: driver?.status ?? "AVAILABLE",
      assignedTruckId: driver?.assignedTruckId ?? "",
      ownerId: driver?.ownerId ?? (actor?.role === "TRUCK_OWNER" ? actor.id : ""),
    },
  });
  const selectedOwnerId = watch("ownerId") || actor?.id;
  const availableTrucks = actor?.role === "ADMIN" ? trucks.filter((truck) => truck.ownerId === selectedOwnerId) : myTrucks;

  const submit = handleSubmit(async (values) => {
    if (!actor) return;
    const { ownerId, password, ...driverValues } = values;
    const payload = { ...driverValues, email: values.email, assignedTruckId: values.assignedTruckId };
    const saved = await run(
      async () => {
        let record: Driver;
        if (driver) {
          record = await services.drivers.update(actor, driver.id, payload);
        } else {
          if (!password || password.length < 6) {
            setError("password", { type: "validate", message: "Set an initial password of at least 6 characters." });
            throw new Error("Set an initial password of at least 6 characters.");
          }
          const userId = `driver-${crypto.randomUUID()}`;
          const accountError = await addUser({
            id: userId,
            name: values.name,
            email: values.email,
            phone: values.phone,
            location: users.find((user) => user.id === (actor.role === "ADMIN" ? ownerId : actor.id))?.location ?? "",
            company: "",
            password: password ?? "",
            role: "DRIVER",
          });
          if (accountError) throw new Error(accountError);
          try {
            record = await services.drivers.create(actor, {
              ...payload,
              userId,
              ownerId: actor.role === "ADMIN" ? ownerId : actor.id,
            });
          } catch (error) {
            await deleteUser(userId);
            throw error;
          }
        }
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
        success: driver ? "Driver details saved." : "Driver account created. Submit documents for verification before assigning work.",
        onError: (_error, fields) => applyFieldErrors(setError, fields),
      },
    );
    if (saved) router.push(`${actor.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/owner"}/drivers/${saved.id}`);
  });

  const back = driver
    ? `${actor?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/owner"}/drivers/${driver.id}`
    : `${actor?.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/owner"}/drivers`;

  function closeForm() {
    if (!busy) router.push(back);
  }

  return (
    <Modal
      title={driver ? "Edit driver details" : "Add a new driver"}
      description={driver ? "Update the driver account, licence and truck association." : "Register a driver and associate them with a truck owner and vehicle."}
      onClose={closeForm}
      wide
      footer={
        <>
          <GhostButton type="button" onClick={closeForm} disabled={busy}>Cancel</GhostButton>
          <PrimaryButton type="submit" form="driver-form" disabled={busy || !actor}>{busy ? "Saving…" : driver ? "Save changes" : "Create driver"}</PrimaryButton>
        </>
      }
    >
      <form id="driver-form" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.name?.message}>
            <input className={inputClass} autoComplete="off" aria-invalid={Boolean(errors.name)} {...register("name")} />
          </Field>
          <Field label="Email address" required error={errors.email?.message} hint="Used by the driver to sign in.">
            <input className={inputClass} type="email" autoComplete="off" aria-invalid={Boolean(errors.email)} {...register("email")} />
          </Field>
          <Field label="Phone number" required error={errors.phone?.message}>
            <input className={inputClass} type="tel" aria-invalid={Boolean(errors.phone)} {...register("phone")} />
          </Field>
          {!driver ? (
            <Field label="Temporary password" required error={errors.password?.message} hint="Share this with the driver so they can sign in.">
              <input className={inputClass} type="password" minLength={6} autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...register("password", { required: "Set an initial password.", minLength: { value: 6, message: "Use at least 6 characters." } })} />
            </Field>
          ) : null}
          {actor?.role === "ADMIN" && !driver ? (
            <Field label="Truck owner" required error={errors.ownerId?.message}>
              <select className={inputClass} aria-invalid={Boolean(errors.ownerId)} {...register("ownerId", { required: "Choose a truck owner.", onChange: () => setValue("assignedTruckId", "") })}>
                <option value="">Choose a truck owner</option>
                {users.filter((user) => user.role === "TRUCK_OWNER" && user.active).map((user) => <option key={user.id} value={user.id}>{user.company ?? user.name} · {user.email}</option>)}
              </select>
            </Field>
          ) : null}
          <Field label="National ID number" required error={errors.nationalId?.message} hint="Used for identity verification.">
            <input className={inputClass} autoComplete="off" aria-invalid={Boolean(errors.nationalId)} {...register("nationalId")} />
          </Field>
          <Field label="Licence number" required error={errors.licenceNumber?.message}>
            <input className={inputClass} autoComplete="off" aria-invalid={Boolean(errors.licenceNumber)} {...register("licenceNumber")} />
          </Field>
          <Field label="Licence category" required error={errors.licenceCategory?.message}>
            <select className={inputClass} aria-invalid={Boolean(errors.licenceCategory)} {...register("licenceCategory")}>
              <option value="">Choose category</option>
              {LICENCE_CATEGORIES.map((category) => <option key={category} value={category}>Category {category}</option>)}
            </select>
          </Field>
          <Field label="Licence expiry date" required error={errors.licenceExpiry?.message} hint="Expired licences prevent trip assignment.">
            <input className={inputClass} type="date" aria-invalid={Boolean(errors.licenceExpiry)} {...register("licenceExpiry")} />
          </Field>
          <Field label="Associated truck" required error={errors.assignedTruckId?.message} hint="Every driver must have at least one truck. Trip assignments can be scheduled separately.">
            <select className={inputClass} aria-invalid={Boolean(errors.assignedTruckId)} {...register("assignedTruckId")}>
              <option value="">Choose a truck</option>
              {availableTrucks.map((truck) => <option key={truck.id} value={truck.id}>{truck.plateNumber} · {truck.truckType}</option>)}
            </select>
          </Field>
          {driver ? (
            <Field label="Availability status" error={errors.status?.message}>
              <select className={inputClass} {...register("status")}>
                {DRIVER_STATUS_VALUES.map((status) => <option key={status} value={status}>{statusOf("driver", status).label}</option>)}
              </select>
            </Field>
          ) : null}
        </div>
        <div>
          <FilePicker label={driver ? "Upload a new licence document (optional)" : "Licence document (optional)"} files={licenceFiles} onChange={setLicenceFiles} />
          <p className="mt-2 text-xs text-muted">Licence documents start as pending review. An administrator verifies the document before the driver can be approved.</p>
        </div>
        {driver?.verification && driver.verification !== "APPROVED" ? (
          <Notice tone="warning" title="Not verified yet">Verification status is “{statusOf("verification", driver.verification).label}”. The driver cannot be assigned until approved.</Notice>
        ) : null}
      </form>
    </Modal>
  );
}
