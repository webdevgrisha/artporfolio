import type { ActionError } from "astro:actions";

/** What the form of the newsletter shows after it is sent: each has its message under the field. */
export type SubscribeOutcome = "subscribed" | "invalid" | "failed";

/**
 * The outcome of the action `subscribe` by its error, the same whether the page posted the form
 * or its script sent it. An address refused, by the check of the action or by the API, is
 * BAD_REQUEST; anything else failed.
 */
export function subscribeOutcome(error: ActionError | undefined): SubscribeOutcome {
  if (!error) return "subscribed";

  return error.code === "BAD_REQUEST" ? "invalid" : "failed";
}
