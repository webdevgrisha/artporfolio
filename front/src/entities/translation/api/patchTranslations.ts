import { http } from "@/shared/api/http";
import type { TargetLanguage } from "@/shared/config/languages";

import {
  type ResourceTranslations,
  resourceTranslationsSchema,
  type TranslationEdit,
} from "../model/resourceTranslations";

interface PatchTranslationsParams {
  language: TargetLanguage;
  resource: string;
  /** Only what changed, by key: a person's text, or null to have it translated anew. */
  texts: Record<string, TranslationEdit | null>;
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
