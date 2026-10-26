import { matchPath, useLocation } from "react-router";

import { adminNavigation } from "@/shared/config/routes";

/** Index of the admin page that contains the current URL, or -1. */
export function useActiveAdminPageIndex(): number {
  const { pathname } = useLocation();

  return adminNavigation.findIndex((page) => matchPath({ end: false, path: page.to }, pathname));
}
