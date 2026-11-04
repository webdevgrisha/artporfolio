import { type QueryKey, type UseQueryOptions, useQuery } from "@tanstack/react-query";

import type { Tagged } from "@/shared/api/http";

interface QueryTitleProps<TItem extends { title: string }, TQueryKey extends QueryKey> {
  /** The query of the item, such as a work. */
  query: UseQueryOptions<Tagged<TItem>, Error, Tagged<TItem>, TQueryKey>;
}

/**
 * The title of an item as a crumb, which follows a save. The loader of its page loads it; until
 * then the title is the one in the cache, or none.
 */
export function QueryTitle<TItem extends { title: string }, TQueryKey extends QueryKey>({
  query,
}: QueryTitleProps<TItem, TQueryKey>) {
  const { data } = useQuery(query);

  return data?.data.title ?? "";
}
