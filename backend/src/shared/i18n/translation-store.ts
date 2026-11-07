import type { DocumentSnapshot, Transaction } from "firebase-admin/firestore";
import { warn } from "firebase-functions/logger";
import { z } from "zod";

import { firestore } from "#shared/firebase/firestore";
import { UnprocessableContentError } from "#shared/http/errors";
import { getTranslationUsage, stopsTranslating } from "#shared/i18n/deepl";
import type { TargetLanguage } from "#shared/i18n/languages";
import { translateAll } from "#shared/i18n/translating";
import { translationContext } from "#shared/i18n/translation-context";
import { type HaltReason, readHalted, setHalted } from "#shared/i18n/translation-halt";
import { enqueueTranslation } from "#shared/i18n/translation-queue";
import {
  askForNewTranslation,
  planTranslations,
  type StoredTranslations,
  storedTranslationsSchema,
  storeTranslation,
  type Translations,
  toTranslations,
} from "#shared/i18n/translations";

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

function resourceDocument(resource: string) {
  return firestore().collection("translations").doc(resource);
}

function readResource(snapshot: DocumentSnapshot): StoredResource {
  return snapshot.exists
    ? storedResourceSchema.parse(snapshot.data())
    : { failed: false, sources: {}, translations: {} };
}

function hasMissing({ sources, translations }: StoredResource): boolean {
  return planTranslations(sources, translations).requests.length > 0;
}

/** Puts `resource` in the queue, unless translating is halted: a retry picks it up then. */
async function enqueue(resource: string): Promise<void> {
  if ((await readHalted()) === null) {
    await enqueueTranslation(resource);
  }
}

/** Shows the texts as failed when no task will come for them, so the form does not wait forever. */
async function markFailed(resource: string): Promise<void> {
  try {
    await resourceDocument(resource).update({ failed: true });
  } catch (error) {
    warn("Could not mark translations as failed", { error, resource });
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

/** Drops the translations of a deleted resource; what is left behind harms nothing. */
export async function deleteTranslations(resource: string): Promise<void> {
  try {
    await resourceDocument(resource).delete();
  } catch (error) {
    warn("Could not delete translations", { error, resource });
  }
}

export async function getTranslations(resource: string): Promise<ResourceTranslations> {
  const [snapshot, halted] = await Promise.all([resourceDocument(resource).get(), readHalted()]);
  const saved = readResource(snapshot);
  // While translating is halted no task runs, so what is missing is not on its way.
  const failed = saved.failed || (halted !== null && hasMissing(saved));

  return {
    failed,
    isTranslating: !failed && hasMissing(saved),
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

  if (asksTranslator) {
    try {
      await enqueue(resource);
    } catch (error) {
      await markFailed(resource);
      throw error;
    }
  }

  return getTranslations(resource);
}

/**
 * Makes the missing translations of `resource`. What it made is saved even when a language failed.
 * A text changed or edited meanwhile is left alone. While translating is halted it asks DeepL for
 * nothing: a retry puts the resource back in the queue.
 */
async function translateMissing(resource: string): Promise<void> {
  const [snapshot, halted] = await Promise.all([resourceDocument(resource).get(), readHalted()]);
  const saved = readResource(snapshot);
  const { requests } = planTranslations(saved.sources, saved.translations);

  if (halted !== null || requests.length === 0) {
    return;
  }

  const { errors, made } = await translateAll(
    saved.sources,
    requests,
    translationContext(resource),
  );
  const halt = errors.map(stopsTranslating).find((reason) => reason !== null) ?? null;

  await firestore().runTransaction(async (transaction) => {
    const document = resourceDocument(resource);
    const snapshot = await transaction.get(document);

    // The resource was deleted while the translator worked.
    if (!snapshot.exists) {
      return;
    }

    const current = readResource(snapshot);
    const translations: StoredTranslations = { ...current.translations };

    for (const { key, language, translation } of made) {
      const isStillWanted =
        current.sources[key] === translation.source && !translations[language]?.[key]?.edited;

      if (isStillWanted) {
        storeTranslation(translations, language, key, translation);
      }
    }

    transaction.set(document, { ...current, translations });
  });

  if (halt !== null) {
    await setHalted(halt);
    return;
  }

  if (errors.length > 0) {
    throw errors[0];
  }
}

/**
 * A task of the queue. A failure is thrown, so the queue tries again; after the last try no task
 * comes for the texts still missing, so the resource shows as failed.
 */
export async function runTranslation(resource: string, isLastTry: boolean): Promise<void> {
  try {
    await translateMissing(resource);
  } catch (error) {
    if (isLastTry) {
      await markFailed(resource);
    }

    throw error;
  }
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
