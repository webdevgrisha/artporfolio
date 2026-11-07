import { stopsTranslating } from "#modules/translations/deepl";
import { translateAll } from "#modules/translations/translating";
import { translationContext } from "#modules/translations/translation-context";
import { firestore } from "#shared/firebase/firestore";
import { markFailed, readResource, resourceDocument } from "#shared/i18n/translation-document";
import { readHalted, setHalted } from "#shared/i18n/translation-halt";
import {
  planTranslations,
  type StoredTranslations,
  storeTranslation,
} from "#shared/i18n/translations";

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
    translationContext(resource, saved.sources),
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
