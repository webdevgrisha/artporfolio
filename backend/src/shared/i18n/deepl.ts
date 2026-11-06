import { DeepLClient, type TargetLanguageCode } from "deepl-node";

import { getEnv } from "#shared/config/env";
import { sourceLanguage, type TargetLanguage } from "#shared/i18n/languages";

/** DeepL asks for a regional variant of English and of Portuguese. */
const deeplLanguages: Record<TargetLanguage, TargetLanguageCode> = {
  be: "be",
  de: "de",
  en: "en-GB",
  es: "es",
  fr: "fr",
  it: "it",
  pl: "pl",
  pt: "pt-PT",
  uk: "uk",
};

/** Tells DeepL what the texts are, which it is not billed for and does not translate. */
const context = "Название и описание картины на сайте художника";

/** Firebase Hosting waits 60 seconds for a save, and a save may also encode photos. */
const requestTimeoutMilliseconds = 20_000;

let client: DeepLClient | undefined;

function deepl(): DeepLClient {
  if (!client) {
    const { deeplApiKey } = getEnv();

    if (deeplApiKey === undefined) {
      throw new Error("DEEPL_API_KEY is not set");
    }

    client = new DeepLClient(deeplApiKey, {
      maxRetries: 1,
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
