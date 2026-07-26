import type { WebhookEvent } from "@repo/auth/server";
import { log } from "@repo/observability/log";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { env } from "@/env";
import { handleAuthWebhookEvent } from "./handlers";

export const POST = async (request: Request): Promise<Response> => {
  if (!env.CLERK_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Not configured", ok: false });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!(svixId && svixTimestamp && svixSignature)) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  const body = await request.text();
  const webhook = new Webhook(env.CLERK_WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = webhook.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    log.error("Error verifying Clerk webhook", { error });
    return new Response("Invalid webhook signature", { status: 400 });
  }

  try {
    const result = await handleAuthWebhookEvent(event, svixId);

    return NextResponse.json({ duplicate: result.duplicate, ok: true });
  } catch (error) {
    log.error("Error processing Clerk webhook", {
      error,
      eventId: svixId,
      eventType: event.type,
    });

    return NextResponse.json(
      { message: "Unable to process webhook", ok: false },
      { status: 500 }
    );
  }
};
