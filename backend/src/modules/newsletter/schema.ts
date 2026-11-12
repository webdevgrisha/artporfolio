import type { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { languages } from "#shared/i18n/languages";

/** The longest address SMTP can deliver to (RFC 5321, section 4.5.3.1). */
const maxEmailLength = 254;

/** A visitor subscribing from the site, in the language of the page they subscribed on. */
export const subscribeBodySchema = z.strictObject({
  email: z.string().trim().max(maxEmailLength).pipe(z.email()),
  language: z.enum(languages),
});

export type SubscribeBody = z.infer<typeof subscribeBodySchema>;

/** A subscriber as stored in Firestore: the address as typed, so mail goes where it was asked. */
export interface StoredSubscriber extends SubscribeBody {
  subscribedAt: Timestamp;
}
