import { NOTIFICATION_CATEGORIES } from "@/services/mock/platform";
import type { NotificationCategory } from "@/types/ops";

// Labels only: the list of categories lives with the notification service.
export { NOTIFICATION_CATEGORIES };

export function categoryLabel(category: NotificationCategory): string {
  return NOTIFICATION_CATEGORIES.find((item) => item.key === category)?.label ?? category;
}
