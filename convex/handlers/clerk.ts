/* eslint-disable @typescript-eslint/no-explicit-any */
import { httpAction } from "../_generated/server";
import { Webhook } from "svix";
import { api } from "../_generated/api";

const clerkWebHookHandler = httpAction(async (ctx, request) => {
  const webHookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!webHookSecret) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set");
  }

  // check headers
  const svix_id = request.headers.get("svix-id");
  const svix_timestamp = request.headers.get("svix-timestamp");
  const svix_signature = request.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred --- no svix headers", {
      status: 400,
    });
  }

  const payload = await request.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(webHookSecret);
  let evt: any;

  // verify the webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new Response("Error occurred --- webhook verification failed", {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url, username } =
      evt.data;
    const email = email_addresses[0]?.email_address || "";
    const name = `${first_name || ""} ${last_name || ""}`.trim();

    try {
      await ctx.runMutation(api.users.createClerkUser, {
        clerkId: id,
        email,
        image: image_url || "",
        fullname: name,
        username: username || email.split("@")[0],
      });
    } catch (error) {
      console.error("Error creating user:", error);
      return new Response("Error occurred --- creating user failed", {
        status: 500,
      });
    }
  }
  return new Response("Webhook processed successfully", {
    status: 200,
  });
});

export default clerkWebHookHandler;
