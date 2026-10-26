import { matchPath, useLocation } from "react-router";

import { adminPages } from "@/pages/Admin/config/pages";

/** Index of the admin page that contains the current URL, or -1. */
export function useActiveAdminPageIndex(): number {
  const { pathname } = useLocation();

  return adminPages.findIndex((page) => matchPath({ end: false, path: page.to }, pathname));
}
