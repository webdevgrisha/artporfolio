import type { Transaction } from "firebase-admin/firestore";
import { warn } from "firebase-functions/logger";

import { firestore } from "#shared/firebase/firestore";
import { markFailed, readResource, resourceDocument } from "#shared/i18n/translation-document";
import { readHalted } from "#shared/i18n/translation-halt";
import { enqueueTranslation } from "#shared/i18n/translation-queue";
import { planTranslations } from "#shared/i18n/translations";

/** Puts `resource` in the queue, unless translating is halted: a retry picks it up then. */
export async function enqueue(resource: string): Promise<void> {
  if ((await readHalted()) === null) {
    await enqueueTranslation(resource);
  }
}

/**
 * Records the texts of a resource in the transaction that saves it, so that they can never differ
 * from what was saved: of two saves the later one wins here too. It only writes, as a transaction
 * reads everything first; requestTranslations does the rest after the save.
 */
export function saveSources(
  transaction: Transaction,
  resource: string,
  sources: Record<string, string>,
): void {
  transaction.set(
    resourceDocument(resource),
    { failed: false, sources },
    { mergeFields: ["failed", "sources"] },
  );
}

/**
 * Asks for the translations the texts recorded by saveSources need. The save has already gone
 * through, so a failure here is only logged, and the texts show as failed: a new translation of
 * any of them asks again.
 */
export async function requestTranslations(resource: string): Promise<void> {
  try {
    const needsTranslator = await firestore().runTransaction(async (transaction) => {
      const document = resourceDocument(resource);
      const saved = readResource(await transaction.get(document));
      const { kept, requests } = planTranslations(saved.sources, saved.translations);

      transaction.set(document, { ...saved, translations: kept });
      return requests.length > 0;
    });

    if (needsTranslator) {
      await enqueue(resource);
    }
  } catch (error) {
    warn("Could not ask for translations", { error, resource });
    await markFailed(resource);
  }
}

/**
 * Drops the translations of a resource in the transaction that deletes it, so that a resource
 * created again with the same id never loses translations of its own to a late cleanup.
 */
export function deleteTranslations(transaction: Transaction, resource: string): void {
  transaction.delete(resourceDocument(resource));
}
