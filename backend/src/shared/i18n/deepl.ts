import { DeepLClient, type TargetLanguageCode } from "deepl-node";

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

/** A save waits for the requests, so a stuck one must fail soon; see translating.ts. */
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
