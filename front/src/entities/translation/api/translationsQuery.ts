import { queryOptions } from "@tanstack/react-query";

import { http } from "@/shared/api/http";
import { isSessionExpiredError } from "@/shared/api/requestErrorMessages";

import { resourceTranslationsSchema } from "../model/resourceTranslations";

/** How often an open form asks whether the translator has finished. */
const translationPollMilliseconds = 2_000;

/** The key that all the translations of the cache start with. */
export const allTranslationsKey = ["translations"] as const;

/** The translations of `resource`, read again while the translator works and the session lasts. */
export function translationsQuery(resource: string) {
  return queryOptions({
    queryFn: () =>
      http.get({ path: `/translations/${resource}`, schema: resourceTranslationsSchema }),
    queryKey: [...allTranslationsKey, resource],
    refetchInterval: ({ state }) =>
      state.data?.isTranslating && !isSessionExpiredError(state.error)
        ? translationPollMilliseconds
        : false,
  });
}
