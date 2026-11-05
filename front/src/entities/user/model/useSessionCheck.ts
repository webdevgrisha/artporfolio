import React from "react";
import { useLocation, useNavigate } from "react-router";

import { HttpError } from "@/shared/api/httpError";
import { loginPath } from "@/shared/config/routes";

import { getCurrentUser } from "../api/getCurrentUser";

/**
 * Checks the session behind every move to another page of the admin, which waits for nothing: most
 * pages load public data, so without it an expired session would show only on the next save. A
 * session that has ended sends the user to the login page, which brings them back. Any other
 * failure, such as no connection, says nothing about the session.
 */
export function useSessionCheck(): void {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // The loader of the layout has just checked the page the admin was entered on.
  const checkedPathname = React.useRef(pathname);

  React.useEffect(() => {
    if (checkedPathname.current === pathname) return;
    checkedPathname.current = pathname;

    let isCurrent = true;

    getCurrentUser().catch((error: unknown) => {
      if (isCurrent && error instanceof HttpError && error.status === 401) {
        void navigate(loginPath(`${pathname}${window.location.search}`), { replace: true });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [navigate, pathname]);
}
