import { httpRouter } from "convex/server";
import clerkWebHookHandler from "./handlers/clerk";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: clerkWebHookHandler,
});

export default http;
