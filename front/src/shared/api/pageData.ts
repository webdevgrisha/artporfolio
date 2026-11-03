import type { FetchQueryOptions, QueryKey } from "@tanstack/react-query";

import { queryClient } from "./queryClient";

/** What the loader of a page returns: the load of the page's data, which the page waits for. */
export interface PageData {
  loading: Promise<void>;
}

/**
 * Loads a query afresh, even when it is cached: a form, or a list, takes its saved values and
 * their ETag from it once, so they must not be outdated.
 */
export function fetchFresh<TQueryFnData, TError, TData, TQueryKey extends QueryKey>(
  query: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): Promise<TData> {
  return queryClient.fetchQuery({ ...query, staleTime: 0 });
}

/**
 * The data of a page, from the loads its loader has started, usually with `fetchFresh`. The
 * navigation does not wait for them: the page opens at once and shows its skeleton until they are
 * in the cache (AwaitPageData).
 */
export function loadPageData(...loads: readonly Promise<unknown>[]): PageData {
  const loading = Promise.all(loads).then(() => undefined);

  // The page rethrows a failure to its error boundary; a page left before its data arrived never
  // looks at it, and that is no error.
  loading.catch(() => undefined);

  return { loading };
}
