"use client";

import { useState } from "react";
import { z } from "zod";
import { PublicPage } from "@/components/public-page";
import { controlClass, FormField } from "@/components/common/form-fields";
import { Notice } from "@/components/common/notices";
import { PrimaryButton } from "@/components/ui";
import { useZodForm } from "@/lib/forms";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  topic: z.enum(["BOOKING", "PAYMENT", "ACCOUNT", "PARTNERSHIP", "OTHER"]),
  message: z.string().trim().min(15, "Tell us a little more (at least 15 characters)."),
});

export default function ContactPage() {
  const [sent, setSent] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useZodForm(schema, { defaultValues: { name: "", email: "", topic: "BOOKING", message: "" } });

  const submit = handleSubmit(async (values) => {
    // The contact form is local to this demonstration; no message is sent.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSent(`Thanks ${values.name.split(" ")[0]}, your message was saved in this browser. No email was sent.`);
    reset();
  });

  return (
    <PublicPage eyebrow="Contact & support" title="We are here to help" intro="Reach the iBanga team about bookings, payments, accounts or partnerships." width="max-w-5xl">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-3xl border border-line bg-card p-6 shadow-soft sm:p-8">
          <h2 className="font-display text-xl text-navy">Send us a message</h2>
          <p className="mt-1 text-sm text-muted">Signed-in customers get a faster answer by opening a support ticket from their dashboard.</p>
          {sent ? <div className="mt-5"><Notice tone="success" title="Message recorded">{sent}</Notice></div> : null}
          <form onSubmit={submit} noValidate className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Your name" required error={errors.name?.message}>
                <input className={controlClass} aria-invalid={Boolean(errors.name)} autoComplete="name" {...register("name")} />
              </FormField>
              <FormField label="Email" required error={errors.email?.message}>
                <input className={controlClass} type="email" aria-invalid={Boolean(errors.email)} autoComplete="email" {...register("email")} />
              </FormField>
            </div>
            <FormField label="Topic" error={errors.topic?.message}>
              <select className={controlClass} {...register("topic")}>
                <option value="BOOKING">A booking or shipment</option>
                <option value="PAYMENT">Payments, refunds or settlements</option>
                <option value="ACCOUNT">My account or verification</option>
                <option value="PARTNERSHIP">Partnerships</option>
                <option value="OTHER">Something else</option>
              </select>
            </FormField>
            <FormField label="Message" required error={errors.message?.message}>
              <textarea className={`${controlClass} min-h-36 resize-y`} aria-invalid={Boolean(errors.message)} {...register("message")} />
            </FormField>
            <PrimaryButton type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? "Sending…" : "Send message"}
            </PrimaryButton>
          </form>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg text-navy">Telephone</h2>
            <p className="mt-2 text-sm"><a className="font-semibold text-brand hover:text-brand-dark" href="tel:+250780000001">+250 780 000 001</a></p>
            <p className="text-sm"><a className="font-semibold text-brand hover:text-brand-dark" href="tel:+250788441220">+250 788 441 220</a></p>
            <p className="mt-2 text-xs text-muted">Monday to Friday, 08:00 to 17:00 (CAT).</p>
          </section>
          <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg text-navy">Email</h2>
            <p className="mt-2 text-sm"><a className="font-semibold text-brand hover:text-brand-dark" href="mailto:admin@ibanga.com">admin@ibanga.com</a></p>
          </section>
          <section className="rounded-2xl border border-line bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg text-navy">Office</h2>
            <address className="mt-2 text-sm not-italic leading-6 text-navy">KN 85 Street<br />Nyarugenge, Kigali<br />Rwanda</address>
          </section>
        </aside>
      </div>
    </PublicPage>
  );
}
