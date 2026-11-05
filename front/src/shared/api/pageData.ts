import type { FetchQueryOptions } from "@tanstack/react-query";

import { queryClient } from "./queryClient";

/** What the loader of a page returns: the load of the page's data, which the page waits for. */
export interface PageData {
  /** The cache has all the page shows, so it opens at once and `loading` only refreshes it. */
  isCached?: boolean;
  loading: Promise<void>;
}

// biome-ignore lint/suspicious/noExplicitAny: the queries of a page differ in their data and keys.
type PageQuery = FetchQueryOptions<any, any, any, any>;

/**
 * The loads of a page's data, each afresh even when it is cached: a form, or a list, takes its saved
 * values and their ETag from it once, so they must not be outdated. The navigation does not wait
 * for them: the page opens at once and shows its skeleton until they are in the cache
 * (AwaitPageData).
 */
export function loadFresh(...queries: readonly PageQuery[]): PageData {
  const loading = Promise.all(
    queries.map((query) => queryClient.fetchQuery({ ...query, staleTime: 0 })),
  ).then(() => undefined);

  // The page rethrows a failure to its error boundary; a page left before its data arrived never
  // looks at it, and that is no error.
  loading.catch(() => undefined);

  return { loading };
}

/**
 * The loads of a page that only shows its data, such as a table: coming back to it shows the cache
 * at once, and the fresh data replaces it when it arrives. Data a change has outdated is not shown,
 * so a save is never followed by its old values; the page waits for it, as with `loadFresh`.
 */
export function loadCached(...queries: readonly PageQuery[]): PageData {
  const isCached = queries.every(({ queryKey }) => {
    const state = queryClient.getQueryState(queryKey);

    return state?.data !== undefined && !state.isInvalidated;
  });

  return { ...loadFresh(...queries), isCached };
}
