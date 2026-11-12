import { createHash } from "node:crypto";

import { Timestamp } from "firebase-admin/firestore";

import type { StoredSubscriber, SubscribeBody } from "#modules/newsletter/schema";
import { firestore } from "#shared/firebase/firestore";

/** The status Firestore rejects a create with when the document exists (gRPC ALREADY_EXISTS). */
const alreadyExists = 6;

/**
 * The id of a subscriber: the address in small letters, so «Anna@Mail.com» and «anna@mail.com»
 * are one subscriber, hashed so the address itself is never part of a path or a log line.
 */
function subscriberId(email: string): string {
  return createHash("sha256").update(email.toLowerCase()).digest("hex");
}

/**
 * Adds a subscriber. An address already subscribed keeps its first subscription, and the caller
 * learns nothing about it: the API answers the same either way, so no one can check an address.
 */
export async function addSubscriber(body: SubscribeBody): Promise<void> {
  const subscriber: StoredSubscriber = { ...body, subscribedAt: Timestamp.now() };

  try {
    await firestore().collection("subscribers").doc(subscriberId(body.email)).create(subscriber);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === alreadyExists)) throw error;
  }
}
