"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldValues, type Path, type Resolver, type UseFormProps, type UseFormSetError } from "react-hook-form";
import type { z } from "zod";

/**
 * React Hook Form wired to a Zod schema. Define one schema per form (see `src/schemas`) so the
 * same rules can be reused by any future server-side validation.
 */
export function useZodForm<S extends z.ZodType>(
  schema: S,
  options: Omit<UseFormProps<z.input<S> & FieldValues, unknown, z.output<S>>, "resolver"> = {},
) {
  type Input = z.input<S> & FieldValues;
  return useForm<Input, unknown, z.output<S>>({
    mode: "onTouched",
    ...options,
    resolver: zodResolver(schema as never) as unknown as Resolver<Input, unknown, z.output<S>>,
  });
}

/** Puts per-field errors returned by a service back onto the matching form fields. */
export function applyFieldErrors<T extends FieldValues>(setError: UseFormSetError<T>, errors: Record<string, string> | undefined) {
  if (!errors) return;
  for (const [field, message] of Object.entries(errors)) {
    setError(field as Path<T>, { type: "server", message });
  }
}

export type PickedFile = { name: string; url: string; mimeType: string; sizeBytes: number };

/** Reads a File into a data URL. Demonstration only: a real upload service would return a signed URL. */
export function readFileAsDataUrl(file: File, maxMegabytes = 3): Promise<PickedFile> {
  return new Promise((resolve, reject) => {
    if (file.size > maxMegabytes * 1024 * 1024) {
      reject(new Error(`${file.name} is larger than ${maxMegabytes} MB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, url: String(reader.result), mimeType: file.type || "application/octet-stream", sizeBytes: file.size });
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}
