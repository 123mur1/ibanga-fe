/**
 * iBanga's public contact details. The Contact page and the home page footer both read from
 * here, so change a number or the email in this one place.
 */
export const CONTACT = {
  /** `display` is what people read; the `tel:` link is built from it. */
  phones: [{ display: "+250 792 017 511" }, { display: "+250 787 112 632" }],
  email: "patrickmurokore172@gmail.com",
  hours: "Monday to Friday, 08:00 to 17:00 (CAT).",
  address: ["KN 85 Street", "Nyarugenge, Kigali", "Rwanda"],
};

/** A `tel:` link for a phone number as written, e.g. "+250 792 017 511" → "tel:+250792017511". */
export const telHref = (display: string) => `tel:${display.replace(/[^+\d]/g, "")}`;
