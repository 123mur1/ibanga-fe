"use client";

import { QueryBoundary } from "@/components/common/async-state";
import { ConfirmButton } from "@/components/common/confirm-button";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Section } from "@/components/common/layout-blocks";
import { Notice } from "@/components/common/notices";
import { PageHeader, PrimaryButton } from "@/components/ui";
import { useAction } from "@/hooks/use-action";
import { useActor } from "@/hooks/use-actor";
import { useServiceQuery } from "@/hooks/use-service-query";
import { formatDate } from "@/lib/format";
import { applyFieldErrors, useZodForm } from "@/lib/forms";
import { services } from "@/services";
import { announcementSchema } from "./schemas";
import { useUserNames } from "./admin-page";

const AUDIENCES = { ALL: "Everyone", IMPORTER: "Importers", TRUCK_OWNER: "Truck owners", DRIVER: "Drivers", ADMIN: "Administrators" } as const;
const SEVERITY_TONE = { INFO: "info", WARNING: "warning", CRITICAL: "danger" } as const;

export function AnnouncementsView() {
  const actor = useActor();
  const name = useUserNames();
  const { run } = useAction();
  const query = useServiceQuery(() => services.notifications.listAnnouncements(actor!), [actor?.id]);

  return (
    <>
      <PageHeader eyebrow="Communication" title="Announcements" subtitle="Publish notices to a group of users. They appear in each user's notifications and dashboard." />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Section title="Published announcements">
          <QueryBoundary query={query} isEmpty={(items) => items.length === 0} empty={{ title: "No announcements", text: "Published announcements appear here." }}>
            {(items) => (
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.id}>
                    <Notice tone={SEVERITY_TONE[item.severity]} title={item.title}>
                      <p className="whitespace-pre-line">{item.body}</p>
                      <p className="mt-2 text-xs opacity-80">
                        To {AUDIENCES[item.audience].toLowerCase()} · published {formatDate(item.publishedAt)} by {name(item.publishedBy)}
                        {item.expiresAt ? ` · expires ${formatDate(item.expiresAt)}` : " · no expiry"}
                      </p>
                      <div className="mt-3">
                        <ConfirmButton
                          variant="ghost"
                          tone="danger"
                          label="Remove"
                          title="Remove this announcement?"
                          message={`"${item.title}" will no longer be shown to ${AUDIENCES[item.audience].toLowerCase()}.`}
                          onConfirm={() => run(() => services.notifications.removeAnnouncement(actor!, item.id), { success: "Announcement removed." })}
                        />
                      </div>
                    </Notice>
                  </li>
                ))}
              </ul>
            )}
          </QueryBoundary>
        </Section>
        <PublishForm />
      </div>
    </>
  );
}

function PublishForm() {
  const actor = useActor()!;
  const { run, busy } = useAction();
  const { register, handleSubmit, reset, setError, formState: { errors } } = useZodForm(announcementSchema, {
    defaultValues: { title: "", body: "", audience: "ALL", severity: "INFO", expiresOn: "" },
  });

  const submit = handleSubmit(async (values) => {
    const done = await run(
      () =>
        services.notifications.publishAnnouncement(actor, {
          title: values.title,
          body: values.body,
          audience: values.audience,
          severity: values.severity,
          expiresAt: values.expiresOn ? `${values.expiresOn}T23:59:59.000Z` : undefined,
        }),
      { success: "Announcement published.", toastError: false, onError: (_, fields) => applyFieldErrors(setError, fields) },
    );
    if (done) reset();
  });

  return (
    <Section title="Publish an announcement">
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormField label="Title" required error={errors.title?.message}>
          <input className={controlClass} aria-invalid={Boolean(errors.title)} {...register("title")} />
        </FormField>
        <FormField label="Message" required error={errors.body?.message}>
          <textarea className={`${controlClass} min-h-28 resize-y`} aria-invalid={Boolean(errors.body)} {...register("body")} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Audience" error={errors.audience?.message}>
            <select className={controlClass} {...register("audience")}>
              {Object.entries(AUDIENCES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </FormField>
          <FormField label="Severity" error={errors.severity?.message}>
            <select className={controlClass} {...register("severity")}>
              <option value="INFO">Information</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </FormField>
        </div>
        <FormField label="Expires on" hint="Optional. Leave empty to keep it until removed." error={errors.expiresOn?.message}>
          <input type="date" className={controlClass} aria-invalid={Boolean(errors.expiresOn)} {...register("expiresOn")} />
        </FormField>
        <PrimaryButton type="submit" disabled={busy} className="w-full">{busy ? "Publishing…" : "Publish announcement"}</PrimaryButton>
      </form>
    </Section>
  );
}
