import { queryOptions } from "@tanstack/react-query";

import { http } from "@/shared/api/http";

import { translationStateSchema } from "../model/translationState";

/** How often an open admin learns that translating stopped: a background task may stop it. */
const translationStatePollMilliseconds = 60_000;

/** How translating goes as a whole. */
export const translationStateQuery = queryOptions({
  queryFn: () => http.get({ path: "/translations/status", schema: translationStateSchema }),
  queryKey: ["translations-state"],
  refetchInterval: translationStatePollMilliseconds,
});
