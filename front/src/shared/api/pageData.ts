import { type FetchQueryOptions, isCancelledError, type QueryKey } from "@tanstack/react-query";

import { queryClient } from "./queryClient";

/** What the loader of a page returns: the load of the page's data, which the page waits for. */
export interface PageData {
  loading: Promise<void>;
}

/**
 * Loads a query afresh, even when it is cached: a form, or a list, takes its saved values and
 * their ETag from it once, so they must not be outdated.
 */
export async function fetchFresh<TQueryFnData, TError, TData, TQueryKey extends QueryKey>(
  query: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): Promise<TData> {
  try {
    return await queryClient.fetchQuery({ ...query, staleTime: 0 });
  } catch (error) {
    // TanStack Query cancels a request when the last component that reads the query unmounts
    // during it, such as the title of a section in the breadcrumbs, which StrictMode mounts twice.
    // The page still waits for the data, so it is loaded again; a request that a component has
    // started since is joined, not repeated.
    if (isCancelledError(error)) return fetchFresh(query);
    throw error;
  }
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
