"use client";

import { controlClass, FormField } from "@/components/common/form-fields";
import { Section } from "@/components/common/layout-blocks";
import { PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useZodForm } from "@/lib/forms";
import { useIbanga } from "@/lib/store";
import type { User } from "@/lib/types";
import { companyProfileSchema } from "./schemas";

function Form({ user }: { user: User }) {
  const { updateProfile } = useIbanga();
  const { run, busy } = useAction();
  const { register, handleSubmit, formState: { errors } } = useZodForm(companyProfileSchema, {
    defaultValues: { company: user.company ?? "", phone: user.phone, location: user.location },
  });

  const submit = handleSubmit(async (values) => {
    await run(
      async () => {
        const problem = await updateProfile(values);
        if (problem) throw new Error(problem);
      },
      { success: "Company profile saved." },
    );
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Company" required error={errors.company?.message} className="sm:col-span-2">
          <input className={controlClass} aria-invalid={Boolean(errors.company)} autoComplete="organization" {...register("company")} />
        </FormField>
        <FormField label="Phone" required error={errors.phone?.message}>
          <input className={controlClass} type="tel" aria-invalid={Boolean(errors.phone)} autoComplete="tel" {...register("phone")} />
        </FormField>
        <FormField label="Location" required error={errors.location?.message}>
          <input className={controlClass} aria-invalid={Boolean(errors.location)} {...register("location")} />
        </FormField>
      </div>
      <PrimaryButton type="submit" disabled={busy}>{busy ? "Saving…" : "Save company profile"}</PrimaryButton>
    </form>
  );
}

export function CompanyProfileForm() {
  const { currentUser } = useIbanga();
  if (!currentUser) return null;
  return (
    <Section title="Company profile" description="The company details shown to the other side of a booking.">
      <Form key={currentUser.id} user={currentUser} />
    </Section>
  );
}
