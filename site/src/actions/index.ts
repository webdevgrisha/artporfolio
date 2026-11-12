import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";

import { ApiError } from "@/lib/api/apiError";
import { postJson } from "@/lib/api/postJson";
import { languages } from "@/lib/i18n/languages";

/** The longest address SMTP can deliver to (RFC 5321), as the API checks it. */
const maxEmailLength = 254;

/**
 * What a visitor does on the site, run on its server: the browser never calls the API itself.
 * Each action takes a form, so it works without JavaScript too.
 */
export const server = {
  /**
   * Subscribes the visitor to the newsletter in the language of the page. `website` is a trap: the
   * field is hidden from people, so only a bot fills it, and the bot is told it subscribed.
   */
  subscribe: defineAction({
    accept: "form",
    input: z.object({
      email: z.string().trim().max(maxEmailLength).pipe(z.email()),
      language: z.enum(languages),
      website: z.string().optional(),
    }),
    handler: async ({ email, language, website }) => {
      if (website) return;

      try {
        await postJson("newsletter/subscribers", { email, language });
      } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
          throw new ActionError({ code: "BAD_REQUEST", message: "The API refused the address" });
        }

        console.error("A visitor could not subscribe to the newsletter:", error);
        throw new ActionError({ code: "INTERNAL_SERVER_ERROR" });
      }
    },
  }),
};
