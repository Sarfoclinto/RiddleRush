/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as actions from "../actions.js";
import type * as category from "../category.js";
import type * as handlers_clerk from "../handlers/clerk.js";
import type * as http from "../http.js";
import type * as notification from "../notification.js";
import type * as playtime from "../playtime.js";
import type * as presence from "../presence.js";
import type * as riddles from "../riddles.js";
import type * as roomPlaytime from "../roomPlaytime.js";
import type * as rooms from "../rooms.js";
import type * as signal from "../signal.js";
import type * as users from "../users.js";
import type * as utils_fns from "../utils/fns.js";
import type * as utils_playtimeHelpers from "../utils/playtimeHelpers.js";
import type * as utils_riddleFns from "../utils/riddleFns.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  category: typeof category;
  "handlers/clerk": typeof handlers_clerk;
  http: typeof http;
  notification: typeof notification;
  playtime: typeof playtime;
  presence: typeof presence;
  riddles: typeof riddles;
  roomPlaytime: typeof roomPlaytime;
  rooms: typeof rooms;
  signal: typeof signal;
  users: typeof users;
  "utils/fns": typeof utils_fns;
  "utils/playtimeHelpers": typeof utils_playtimeHelpers;
  "utils/riddleFns": typeof utils_riddleFns;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
