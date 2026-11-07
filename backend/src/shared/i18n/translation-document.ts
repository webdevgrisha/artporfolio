import type { DocumentSnapshot } from "firebase-admin/firestore";
import { warn } from "firebase-functions/logger";
import { z } from "zod";

import { firestore } from "#shared/firebase/firestore";
import { planTranslations, storedTranslationsSchema } from "#shared/i18n/translations";

/**
 * The translations of one resource, in a document of their own: the translator writes here in the
 * background, so the resource and its entity tag never change under an open form.
 */
const storedResourceSchema = z.object({
  /** The texts in the source language, as last saved, by key. */
  sources: z.record(z.string(), z.string()),
  /** A resource saved for the first time has none yet: see saveSources. */
  translations: storedTranslationsSchema.default({}),
  /** Whether the queue gave up on the translations still missing. */
  failed: z.boolean(),
});

type StoredResource = z.infer<typeof storedResourceSchema>;

export function resourceDocument(resource: string) {
  return firestore().collection("translations").doc(resource);
}

export function readResource(snapshot: DocumentSnapshot): StoredResource {
  return snapshot.exists
    ? storedResourceSchema.parse(snapshot.data())
    : { failed: false, sources: {}, translations: {} };
}

export function hasMissing({ sources, translations }: StoredResource): boolean {
  return planTranslations(sources, translations).requests.length > 0;
}

/** Shows the texts as failed when no task will come for them, so the form does not wait forever. */
export async function markFailed(resource: string): Promise<void> {
  try {
    await resourceDocument(resource).update({ failed: true });
  } catch (error) {
    warn("Could not mark translations as failed", { error, resource });
  }
}
