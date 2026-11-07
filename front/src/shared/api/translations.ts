import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import type { TargetLanguage } from "@/shared/config/languages";

import { http } from "./http";

/** Who wrote a translation, and whether it is about to change or fell behind the Russian text. */
const translationStatuses = ["auto", "edited", "outdated", "pending"] as const;

export type TranslationStatus = (typeof translationStatuses)[number];

const translationSchema = z.object({
  status: z.enum(translationStatuses),
  text: z.string(),
});

/** The translations of a resource, which the server keeps apart from the resource itself. */
const resourceTranslationsSchema = z.object({
  /** The Russian texts as last saved, by key. */
  sources: z.record(z.string(), z.string()),
  /** By language and then by key; a text not translated yet is left out. */
  translations: z.record(z.string(), z.record(z.string(), translationSchema)),
  /** Whether the translator is still to make some of the texts. */
  isTranslating: z.boolean(),
  /** Whether the server gave up on some of the texts. */
  failed: z.boolean(),
});

export type ResourceTranslations = z.infer<typeof resourceTranslationsSchema>;

/** How often an open form asks whether the translator has finished. */
const translationPollMilliseconds = 2_000;

/** The key that all the translations of the cache start with. */
export const allTranslationsKey = ["translations"] as const;

/** The translations of `resource`, read again while the translator works. */
export function translationsQuery(resource: string) {
  return queryOptions({
    queryFn: () =>
      http.get({ path: `/translations/${resource}`, schema: resourceTranslationsSchema }),
    queryKey: [...allTranslationsKey, resource],
    refetchInterval: ({ state }) =>
      state.data?.isTranslating ? translationPollMilliseconds : false,
  });
}

interface PatchTranslationsParams {
  language: TargetLanguage;
  resource: string;
  /** Only what changed, by key: a person's text, or null to have it translated anew. */
  texts: Record<string, string | null>;
}

export function patchTranslations({
  language,
  resource,
  texts,
}: PatchTranslationsParams): Promise<ResourceTranslations> {
  return http.patch({
    body: texts,
    path: `/translations/${resource}/${language}`,
    schema: resourceTranslationsSchema,
  });
}

const translationStateSchema = z.object({
  /** Why nothing is translated for now, or null while everything works. */
  halted: z.enum(["limit", "key", "paused"]).nullable(),
  /** How much of the plan is used; null when DeepL does not say. */
  usage: z.object({ limit: z.number(), used: z.number() }).nullable(),
});

export type TranslationState = z.infer<typeof translationStateSchema>;

/** How often an open admin learns that translating stopped: a background task may stop it. */
const translationStatePollMilliseconds = 60_000;

/** How translating goes as a whole. */
export const translationStateQuery = queryOptions({
  queryFn: () => http.get({ path: "/translations/status", schema: translationStateSchema }),
  queryKey: ["translations-state"],
  refetchInterval: translationStatePollMilliseconds,
});

/** Lifts a halt and sends every text still missing to the translator. */
export function retryTranslations(): Promise<void> {
  return http.postVoid({ path: "/translations/retry" });
}
