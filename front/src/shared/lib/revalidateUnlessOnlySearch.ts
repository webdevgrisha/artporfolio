import type { ShouldRevalidateFunctionArgs } from "react-router";

/**
 * For a page whose search parameters are only a view of it, such as the search of a table or the
 * language of a form: a change of them alone loads nothing again.
 */
export function revalidateUnlessOnlySearch({
  currentUrl,
  defaultShouldRevalidate,
  nextUrl,
}: ShouldRevalidateFunctionArgs): boolean {
  const changesOnlySearch =
    currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search;

  return !changesOnlySearch && defaultShouldRevalidate;
}
