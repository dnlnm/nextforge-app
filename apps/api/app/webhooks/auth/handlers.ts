import { analytics } from "@repo/analytics/server";
import type { WebhookEvent } from "@repo/auth/server";
import { synchronizeAuthEvent } from "./synchronize";

export const handleAuthWebhookEvent = async (
  event: WebhookEvent,
  eventId: string
) => {
  const result = await synchronizeAuthEvent(event, eventId);

  if (!result.duplicate) {
    analytics?.capture({
      event: `Clerk ${event.type}`,
      distinctId: event.data.id,
    });
  }

  await analytics?.shutdown();

  return result;
};
