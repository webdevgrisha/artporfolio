import type { FetchQueryOptions } from "@tanstack/react-query";

import { queryClient } from "./queryClient";

/** What the loader of a page returns: the load of the page's data, which the page waits for. */
export interface PageData {
  loading: Promise<void>;
}

/**
 * The loads of a page's data, each afresh even when it is cached: a form, or a list, takes its saved
 * values and their ETag from it once, so they must not be outdated. The navigation does not wait
 * for them: the page opens at once and shows its skeleton until they are in the cache
 * (AwaitPageData).
 */
// biome-ignore lint/suspicious/noExplicitAny: the queries of a page differ in their data and keys.
export function loadFresh(...queries: readonly FetchQueryOptions<any, any, any, any>[]): PageData {
  const loading = Promise.all(
    queries.map((query) => queryClient.fetchQuery({ ...query, staleTime: 0 })),
  ).then(() => undefined);

  // The page rethrows a failure to its error boundary; a page left before its data arrived never
  // looks at it, and that is no error.
  loading.catch(() => undefined);

  return { loading };
}
