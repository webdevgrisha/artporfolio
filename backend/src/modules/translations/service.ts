import { warn } from "firebase-functions/logger";

import { getTranslationUsage } from "#modules/translations/deepl";
import { firestore } from "#shared/firebase/firestore";
import { UnprocessableContentError } from "#shared/http/errors";
import type { TargetLanguage } from "#shared/i18n/languages";
import {
  hasMissing,
  markFailed,
  readResource,
  resourceDocument,
} from "#shared/i18n/translation-document";
import { type HaltReason, readHalted, setHalted } from "#shared/i18n/translation-halt";
import { enqueueTranslation } from "#shared/i18n/translation-queue";
import { enqueue } from "#shared/i18n/translation-requests";
import {
  askForNewTranslation,
  type StoredTranslations,
  storeTranslation,
  type Translations,
  toTranslations,
} from "#shared/i18n/translations";

/** The translations of a resource as the API returns them. */
export interface ResourceTranslations {
  sources: Record<string, string>;
  translations: Translations;
  /** Whether the translator is still to make some of the texts. */
  isTranslating: boolean;
  /** Whether the queue gave up on some of the texts. */
  failed: boolean;
}

/** A person's text, with the text in the source language they wrote it from. */
export interface TranslationEdit {
  source: string;
  text: string;
}

/** How translating goes as a whole, for the admin. */
export interface TranslationStatusResponse {
  halted: HaltReason | null;
  /** How much of the plan is used; null when DeepL does not say. */
  usage: { limit: number; used: number } | null;
}

export async function getTranslations(resource: string): Promise<ResourceTranslations> {
  const [snapshot, halted] = await Promise.all([resourceDocument(resource).get(), readHalted()]);
  const saved = readResource(snapshot);
  const isMissing = hasMissing(saved);
  // Only what is missing can fail; while translating is halted, no task is on its way.
  const failed = isMissing && (saved.failed || halted !== null);

  return {
    failed,
    isTranslating: isMissing && !failed,
    sources: saved.sources,
    translations: toTranslations(saved.translations, saved.sources),
  };
}

/**
 * Saves what a person changed in one language: their edit, or null to ask the translator for a new
 * text. An edit keeps the source it was written from, so one of an older source shows as out of
 * date. A key with no source text is rejected with 422.
 */
export async function editTranslations(
  resource: string,
  language: TargetLanguage,
  texts: Record<string, TranslationEdit | null>,
): Promise<ResourceTranslations> {
  const asksTranslator = Object.values(texts).includes(null);

  await firestore().runTransaction(async (transaction) => {
    const document = resourceDocument(resource);
    const saved = readResource(await transaction.get(document));
    const translations: StoredTranslations = { ...saved.translations };

    for (const [key, edit] of Object.entries(texts)) {
      if (!saved.sources[key]) {
        throw new UnprocessableContentError(`There is no text ${key}`);
      }

      if (edit === null) {
        askForNewTranslation(translations, language, key);
      } else {
        storeTranslation(translations, language, key, { ...edit, edited: true });
      }
    }

    // Only a new task takes back a failure: an edit leaves the other texts as they were.
    transaction.set(document, { ...saved, failed: saved.failed && !asksTranslator, translations });
  });

  // The edit has already gone through, so, as after a save, a refusal of the queue only shows the
  // texts as failed.
  if (asksTranslator) {
    try {
      await enqueue(resource);
    } catch (error) {
      warn("Could not ask for translations", { error, resource });
      await markFailed(resource);
    }
  }

  return getTranslations(resource);
}

export async function getTranslationStatus(): Promise<TranslationStatusResponse> {
  const [halted, usage] = await Promise.all([readHalted(), getTranslationUsage()]);

  return { halted, usage };
}

/**
 * Lifts a halt and puts every resource with missing translations back in the queue. A resource the
 * queue refuses shows as failed and the others still go; the first refusal is thrown at the end.
 */
export async function retryTranslations(): Promise<void> {
  await setHalted(null);

  const { docs } = await firestore().collection("translations").get();
  const refusals: unknown[] = [];

  for (const snapshot of docs) {
    if (hasMissing(readResource(snapshot))) {
      try {
        await enqueueTranslation(snapshot.id);
        await snapshot.ref.update({ failed: false });
      } catch (error) {
        refusals.push(error);
        await markFailed(snapshot.id);
      }
    }
  }

  if (refusals.length > 0) {
    throw refusals[0];
  }
}
