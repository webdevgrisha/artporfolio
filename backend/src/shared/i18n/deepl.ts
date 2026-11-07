import {
  AuthorizationError,
  DeepLClient,
  QuotaExceededError,
  type TargetLanguageCode,
} from "deepl-node";
import { warn } from "firebase-functions/logger";

import { getEnv } from "#shared/config/env";
import { sourceLanguage, type TargetLanguage } from "#shared/i18n/languages";

/** DeepL asks for a regional variant of English and of Portuguese, and a script of Chinese. */
const deeplLanguages: Record<TargetLanguage, TargetLanguageCode> = {
  ar: "ar",
  be: "be",
  cs: "cs",
  de: "de",
  el: "el",
  en: "en-GB",
  es: "es",
  fr: "fr",
  hi: "hi",
  hu: "hu",
  id: "id",
  it: "it",
  ja: "ja",
  ko: "ko",
  lt: "lt",
  nl: "nl",
  pl: "pl",
  pt: "pt-BR",
  ro: "ro",
  sk: "sk",
  sv: "sv",
  tr: "tr",
  uk: "uk",
  vi: "vi",
  zh: "zh-HANS",
};

/** Tells DeepL what the texts are, which it is not billed for and does not translate. */
const context = "Название и описание картины на сайте художника";

/** A task of the queue waits for the requests, so a stuck one must fail soon. */
const requestTimeoutMilliseconds = 10_000;

/** DeepL answers a burst of requests with 429; the client waits longer before each new try. */
const maxRetries = 2;

let client: DeepLClient | undefined;

function deepl(): DeepLClient {
  if (!client) {
    const { deeplApiKey } = getEnv();

    if (deeplApiKey === undefined) {
      throw new Error("DEEPL_API_KEY is not set");
    }

    client = new DeepLClient(deeplApiKey, {
      maxRetries,
      minTimeout: requestTimeoutMilliseconds,
    });
  }

  return client;
}

/** Translates `texts` from the source language, in one request; the result keeps their order. */
export async function translateTexts(texts: string[], language: TargetLanguage): Promise<string[]> {
  const results = await deepl().translateText(texts, sourceLanguage, deeplLanguages[language], {
    context,
    // Paragraphs are separated by a blank line, which the translation must keep.
    preserveFormatting: true,
  });

  return results.map(({ text }) => text.trim());
}

/** Whether `error` stops all translating until a person acts, and why; null for any other. */
export function stopsTranslating(error: unknown): "key" | "limit" | null {
  if (error instanceof QuotaExceededError) {
    return "limit";
  }

  return error instanceof AuthorizationError ? "key" : null;
}

/** How much of the plan is used; null when DeepL does not answer or there is no key. */
export async function getTranslationUsage(): Promise<{ limit: number; used: number } | null> {
  try {
    const { character } = await deepl().getUsage();

    return character ? { limit: character.limit, used: character.count } : null;
  } catch (error) {
    warn("Could not read the use of the plan", { error });
    return null;
  }
}
