import { type UIMatch, useMatches } from "react-router";

import type { BreadcrumbItem } from "@/shared/ui/breadcrumbs";

/**
 * What a route of the admin adds around its page, in its React Router `handle`. A deeper route
 * replaces what a route above it says.
 */
export interface AdminPageHandle {
  /** The way to the page from the top; the last item is the page itself. */
  breadcrumbs?: (match: UIMatch) => BreadcrumbItem[];
}

function handleOf(match: UIMatch): AdminPageHandle {
  return (match.handle ?? {}) as AdminPageHandle;
}

/** The breadcrumbs of the current page, from the deepest route that has them. */
export function useAdminPageHandle() {
  const matches = useMatches();
  const crumbsMatch = matches.findLast((match) => handleOf(match).breadcrumbs);

  return {
    breadcrumbs: crumbsMatch ? handleOf(crumbsMatch).breadcrumbs?.(crumbsMatch) : undefined,
  };
}
