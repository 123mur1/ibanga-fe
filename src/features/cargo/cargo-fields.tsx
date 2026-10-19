"use client";

import { Controller, useFormContext } from "react-hook-form";
import { CheckRow, FilePicker, FormField, controlClass } from "@/components/common/form-fields";
import { Section } from "@/components/common/layout-blocks";
import { LOCATIONS, TRUCK_TYPES } from "@/lib/types";
import { CATEGORY_LABEL } from "./booking-from-quotation";
import { CATEGORY_VALUES, type CargoFormInput } from "./schemas";

type Name = keyof CargoFormInput;

/** One labelled input bound to the surrounding form. */
function Field({
  name,
  label,
  required,
  hint,
  type = "text",
  step,
  inputMode,
  autoComplete,
  className,
}: {
  name: Name;
  label: string;
  required?: boolean;
  hint?: string;
  type?: "text" | "date" | "tel" | "number";
  step?: string;
  inputMode?: "decimal" | "numeric" | "tel";
  autoComplete?: string;
  className?: string;
}) {
  const { register, formState } = useFormContext<CargoFormInput>();
  const error = formState.errors[name]?.message as string | undefined;
  return (
    <FormField label={label} required={required} hint={hint} error={error} className={className}>
      <input className={controlClass} type={type} step={step} inputMode={inputMode} autoComplete={autoComplete} aria-invalid={Boolean(error)} {...register(name)} />
    </FormField>
  );
}

function Area({ name, label, hint, required }: { name: Name; label: string; hint?: string; required?: boolean }) {
  const { register, formState } = useFormContext<CargoFormInput>();
  const error = formState.errors[name]?.message as string | undefined;
  return (
    <FormField label={label} hint={hint} required={required} error={error}>
      <textarea className={`${controlClass} min-h-24 resize-y`} aria-invalid={Boolean(error)} {...register(name)} />
    </FormField>
  );
}

function Pick({ name, label, options, required, placeholder }: { name: Name; label: string; options: { value: string; label: string }[]; required?: boolean; placeholder?: string }) {
  const { register, formState } = useFormContext<CargoFormInput>();
  const error = formState.errors[name]?.message as string | undefined;
  return (
    <FormField label={label} required={required} error={error}>
      <select className={controlClass} aria-invalid={Boolean(error)} {...register(name)}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </FormField>
  );
}

const locationOptions = LOCATIONS.map((location) => ({ value: location, label: location }));

export function CargoDetailsFields() {
  return (
    <Section title="Cargo" description="What needs to be moved. Only a title is needed to save a draft.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="title" label="Title" required className="sm:col-span-2" />
        <Pick name="category" label="Category" required options={CATEGORY_VALUES.map((value) => ({ value, label: CATEGORY_LABEL[value] }))} />
        <Field name="valueRwf" label="Estimated cargo value (RWF)" required inputMode="numeric" hint="Used for insurance and dispute purposes." />
        <div className="sm:col-span-2"><Area name="description" label="Description" required hint="What it is, how it is packed, anything a driver should know." /></div>
      </div>
    </Section>
  );
}

function StopFields({ prefix, title }: { prefix: "pickup" | "delivery"; title: string }) {
  const dateLabel = prefix === "pickup" ? "Pickup date" : "Delivery date";
  return (
    <Section title={title}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Pick name={`${prefix}Location`} label="Location" required placeholder="Choose a location" options={locationOptions} />
        <Field name={`${prefix}Date`} label={dateLabel} required type="date" />
        <Field name={`${prefix}Address`} label="Street address" required className="sm:col-span-2" autoComplete="street-address" />
        <Field name={`${prefix}ContactName`} label="Contact name" required />
        <Field name={`${prefix}ContactPhone`} label="Contact phone" required type="tel" inputMode="tel" autoComplete="tel" />
      </div>
    </Section>
  );
}

export function RouteFields() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <StopFields prefix="pickup" title="Pickup" />
      <StopFields prefix="delivery" title="Destination" />
    </div>
  );
}

export function SizeFields() {
  return (
    <Section title="Size and truck" description="Weight and dimensions decide which trucks can quote.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field name="weightTons" label="Weight (tons)" required inputMode="decimal" />
        <Field name="volumeM3" label="Volume (m³)" required inputMode="decimal" />
        <Field name="minCapacityTons" label="Minimum truck capacity (tons)" required inputMode="decimal" />
        <Field name="lengthM" label="Length (m)" required inputMode="decimal" />
        <Field name="widthM" label="Width (m)" required inputMode="decimal" />
        <Field name="heightM" label="Height (m)" required inputMode="decimal" />
        <Pick name="truckType" label="Required truck type" required placeholder="Choose a truck type" options={TRUCK_TYPES.map((type) => ({ value: type, label: type }))} />
        <Field name="budgetRwf" label="Expected budget (RWF, optional)" inputMode="numeric" hint="Quotations are compared against this." />
      </div>
    </Section>
  );
}

const FLAGS: { name: "fragile" | "hazardous" | "perishable" | "specialHandling"; title: string; description: string }[] = [
  { name: "fragile", title: "Fragile", description: "Breakable or easily damaged." },
  { name: "hazardous", title: "Hazardous", description: "Chemicals, fuel or dangerous goods." },
  { name: "perishable", title: "Perishable", description: "Needs temperature control or fast delivery." },
  { name: "specialHandling", title: "Special handling", description: "Needs equipment or a trained crew." },
];

export function HandlingFields() {
  const { control } = useFormContext<CargoFormInput>();
  return (
    <Section title="Handling and instructions">
      <div className="grid gap-3 sm:grid-cols-2">
        {FLAGS.map((flag) => (
          <Controller key={flag.name} control={control} name={flag.name} render={({ field }) => <CheckRow title={flag.title} description={flag.description} checked={Boolean(field.value)} onChange={field.onChange} />} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Area name="loadingRequirements" label="Loading requirements" hint="Forklift, ramp, loading crew..." />
        <Area name="unloadingRequirements" label="Unloading requirements" />
        <div className="sm:col-span-2"><Area name="instructions" label="Additional instructions" /></div>
      </div>
    </Section>
  );
}

export function AttachmentFields() {
  const { control } = useFormContext<CargoFormInput>();
  return (
    <Section title="Photos and documents" description="Optional. Photos help owners quote accurately.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Controller control={control} name="photos" render={({ field }) => <FilePicker label="Cargo photos" multiple accept="image/*" files={field.value} onChange={field.onChange} />} />
        <Controller control={control} name="documents" render={({ field }) => <FilePicker label="Supporting documents" multiple accept="application/pdf,image/*" files={field.value} onChange={field.onChange} />} />
      </div>
    </Section>
  );
}
