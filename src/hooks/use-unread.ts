"use client";

import { useIbanga } from "@/lib/store";
import { useOps } from "./use-ops";

/** Number of unread in-app notifications for the signed-in user. */
export function useUnreadCount(): number {
  const { currentUser } = useIbanga();
  const { notifications } = useOps();
  if (!currentUser) return 0;
  return notifications.filter((item) => item.userId === currentUser.id && !item.read).length;
}
