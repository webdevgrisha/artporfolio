/**
 * Translates the texts of the interface from `messages/en.json` into every other language of the
 * site with DeepL, and writes `messages/<language>.json`.
 *
 * Only a text that is new, or whose English changed since its translation, goes to DeepL: an edit
 * made by hand in a language file stays until its English changes. `translatedFrom.json` keeps the
 * English each translation was made from. A key gone from English goes from every language.
 *
 * Run with `pnpm --filter site i18n:translate`; the key is DEEPL_API_KEY of backend/.secret.local.
 */
import { readFile, writeFile } from "node:fs/promises";

import { z } from "zod";

import { type Language, languages } from "../src/lib/i18n/languages.ts";

type Texts = Record<string, string>;

const i18nDirectory = new URL("../src/lib/i18n/", import.meta.url);
const sourcesFile = new URL("translatedFrom.json", i18nDirectory);

/** DeepL asks for a regional variant of Portuguese and a script of Chinese. */
const deeplLanguages: Partial<Record<Language, string>> = { pt: "PT-BR", zh: "ZH-HANS" };

/**
 * What DeepL is told the texts are, so a word such as «Gallery» is read as on a website. The site
 * is one person's, so «Get in touch» must not become «Contact us».
 */
const context =
  "Short texts of the interface of the personal website of one painter: links of the menu, " +
  "buttons, labels, headings. The site belongs to one person, not a company: never say «we» or «us».";

/** DeepL takes at most 50 texts in one request. */
const batchSize = 50;

/** How long a request waits for DeepL before the run stops, instead of hanging. */
const timeoutMilliseconds = 60_000;

/** The answer of DeepL, checked before anything is written: one translation for each text. */
const answerSchema = z.object({ translations: z.array(z.object({ text: z.string() })) });

/** DeepL answers a burst of requests with 429, so a refused request waits and goes again. */
const retryDelaysMilliseconds = [2_000, 5_000];

function messagesFile(language: Language): URL {
  return new URL(`messages/${language}.json`, i18nDirectory);
}

async function readJson<T>(file: URL, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(file: URL, value: unknown): Promise<void> {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function deeplKey(): string {
  const key = process.env.DEEPL_API_KEY?.trim();

  if (!key) throw new Error("DEEPL_API_KEY is not set: it is read from backend/.secret.local");

  return key;
}

/** A key of the free plan ends with `:fx` and goes to its own host. */
function deeplUrl(key: string): string {
  const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";

  return `https://${host}/v2/translate`;
}

async function requestTranslations(texts: string[], language: Language): Promise<string[]> {
  const key = deeplKey();

  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(deeplUrl(key), {
      body: JSON.stringify({
        context,
        model_type: "prefer_quality_optimized",
        source_lang: "EN",
        target_lang: deeplLanguages[language] ?? language.toUpperCase(),
        text: texts,
      }),
      headers: { Authorization: `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(timeoutMilliseconds),
    });
    const delay = retryDelaysMilliseconds[attempt];

    if (response.status === 429 && delay !== undefined) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    if (!response.ok) {
      throw new Error(`DeepL refused ${language}: ${response.status} ${await response.text()}`);
    }

    const { translations } = answerSchema.parse(await response.json());

    if (translations.length !== texts.length) {
      throw new Error(
        `DeepL gave ${language} ${translations.length} translations for ${texts.length} texts`,
      );
    }

    return translations.map(({ text }) => text);
  }
}

async function translate(texts: string[], language: Language): Promise<string[]> {
  const translated: string[] = [];

  for (let start = 0; start < texts.length; start += batchSize) {
    translated.push(
      ...(await requestTranslations(texts.slice(start, start + batchSize), language)),
    );
  }

  return translated;
}

const english = await readJson<Texts>(messagesFile("en"), {});
const sources = await readJson<Partial<Record<Language, Texts>>>(sourcesFile, {});

for (const language of languages) {
  if (language === "en") continue;

  const current = await readJson<Texts>(messagesFile(language), {});
  const translatedFrom = sources[language] ?? {};
  const keys = Object.keys(english).filter(
    (key) => current[key] === undefined || translatedFrom[key] !== english[key],
  );
  const translated = await translate(
    keys.map((key) => english[key] ?? ""),
    language,
  );
  const fresh = new Map(keys.map((key, index) => [key, translated[index] ?? ""]));

  // In the order of English, without the keys English no longer has.
  await writeJson(
    messagesFile(language),
    Object.fromEntries(Object.keys(english).map((key) => [key, fresh.get(key) ?? current[key]])),
  );
  sources[language] = { ...english };

  console.log(`${language}: ${keys.length} translated`);
}

await writeJson(sourcesFile, sources);
