"use client";

import { useMemo } from "react";
import { useIbanga } from "@/lib/store";
import type { Actor } from "@/services/types";

/** The signed-in user as a service `Actor`, or null while the session is loading. */
export function useActor(): Actor | null {
  const { currentUser } = useIbanga();
  return useMemo(
    () => (currentUser ? { id: currentUser.id, name: currentUser.name, role: currentUser.role } : null),
    [currentUser],
  );
}
