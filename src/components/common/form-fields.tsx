"use client";

import { useRef, useState } from "react";
import { readFileAsDataUrl, type PickedFile } from "@/lib/forms";

/** Label, hint and error wrapper. Errors are announced to screen readers. */
export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-navy">
        {label}
        {required ? <span className="ml-0.5 text-bad" aria-hidden="true">*</span> : null}
      </span>
      {children}
      {hint && !error ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
      {error ? (
        <span role="alert" className="mt-1 block text-xs font-medium text-bad">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export const controlClass =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-base text-ink outline-none transition placeholder:text-muted/70 hover:border-brand/30 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-background disabled:text-muted aria-[invalid=true]:border-bad";

/** Checkbox row with a title and an optional description. */
export function CheckRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${checked ? "border-brand bg-brand-soft/50" : "border-line bg-white hover:border-brand/30"} ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <input type="checkbox" className="mt-1 h-4 w-4 accent-brand" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span>
        <span className="block text-sm font-semibold text-navy">{title}</span>
        {description ? <span className="block text-xs text-muted">{description}</span> : null}
      </span>
    </label>
  );
}

/**
 * File chooser with previews. Files are read into the page as data URLs for the demonstration;
 * a real build would upload to a storage service and keep only the returned file reference.
 */
export function FilePicker({
  label,
  files,
  onChange,
  multiple = false,
  accept = "image/*,application/pdf",
  maxMegabytes = 3,
  maxFiles = 6,
  error,
  hint,
}: {
  label: string;
  files: PickedFile[];
  onChange: (files: PickedFile[]) => void;
  multiple?: boolean;
  accept?: string;
  maxMegabytes?: number;
  maxFiles?: number;
  error?: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function pick(list: FileList | null) {
    if (!list?.length) return;
    setLocalError(null);
    try {
      const read = await Promise.all([...list].slice(0, multiple ? maxFiles - files.length : 1).map((file) => readFileAsDataUrl(file, maxMegabytes)));
      onChange(multiple ? [...files, ...read].slice(0, maxFiles) : read);
    } catch (problem) {
      setLocalError(problem instanceof Error ? problem.message : "Could not read that file.");
    } finally {
      if (input.current) input.current.value = "";
    }
  }

  const shown = localError ?? error;
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-navy">{label}</span>
      <div className={`rounded-xl border border-dashed bg-background/50 p-4 ${shown ? "border-bad" : "border-line"}`}>
        {files.length ? (
          <ul className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="group relative overflow-hidden rounded-lg border border-line bg-white">
                {file.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.url} alt={`Preview of ${file.name}`} className="h-28 w-full object-cover" />
                ) : (
                  <div className="flex h-28 flex-col items-center justify-center gap-1 bg-brand-soft/50 text-brand-dark">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /></svg>
                    <span className="text-xs font-semibold">Document</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                  <span className="truncate text-xs text-navy" title={file.name}>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => onChange(files.filter((_, position) => position !== index))}
                    aria-label={`Remove ${file.name}`}
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold text-bad hover:bg-bad-soft"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <input ref={input} type="file" className="sr-only" id={`file-${label}`} accept={accept} multiple={multiple} onChange={(event) => void pick(event.target.files)} />
        <label
          htmlFor={`file-${label}`}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-semibold text-navy transition hover:border-brand hover:text-brand ${multiple && files.length >= maxFiles ? "pointer-events-none opacity-50" : ""}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4m-5 5 5-5 5 5M4 17v3h16v-3" /></svg>
          {files.length ? (multiple ? "Add more" : "Replace file") : "Choose file"}
        </label>
        <p className="mt-2 text-xs text-muted">{hint ?? `Images or PDF, up to ${maxMegabytes} MB${multiple ? `, ${maxFiles} files` : ""}.`}</p>
      </div>
      {shown ? <p role="alert" className="mt-1 text-xs font-medium text-bad">{shown}</p> : null}
    </div>
  );
}
