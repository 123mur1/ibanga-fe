"use client";

import { useEffect, useState } from "react";
import { useActor } from "@/hooks/use-actor";
import { services } from "@/services";
import type { OpsDocument } from "@/types/ops";

/**
 * The document's file URL. API lists leave file contents out, so a document with `hasFile` is
 * fetched once it is shown.
 */
export function useDocumentFile(doc: OpsDocument): { url: string; loading: boolean; failed: boolean } {
  const actor = useActor();
  const needsFetch = !doc.fileUrl && Boolean(doc.hasFile);
  const [fetched, setFetched] = useState<{ key: string; url: string; failed: boolean } | null>(null);
  const key = `${doc.id}:${doc.version}`;

  useEffect(() => {
    if (!needsFetch || !actor) return;
    let active = true;
    services.documents
      .getFile(actor, doc.id)
      .then((url) => active && setFetched({ key, url, failed: false }))
      .catch(() => active && setFetched({ key, url: "", failed: true }));
    return () => {
      active = false;
    };
  }, [needsFetch, actor, doc.id, key]);

  if (!needsFetch) return { url: doc.fileUrl, loading: false, failed: false };
  const current = fetched?.key === key ? fetched : null;
  return { url: current?.url ?? "", loading: !current, failed: current?.failed ?? false };
}
