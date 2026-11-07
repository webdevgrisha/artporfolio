import { Navigate, useLocation, useRouteError } from "react-router";

import { HttpError } from "@/shared/api/httpError";
import { getRequestErrorMessage } from "@/shared/api/requestErrorMessages";
import { loginPath } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";

import styles from "./AdminPageError.module.css";

const fallbackMessage = "Не удалось загрузить страницу. Попробуйте ещё раз";

/**
 * Shown in place of an admin page whose data or code failed to load, or which crashed while
 * rendering. The layout stays, so the user can still go to another page. A page whose data was
 * refused for want of a session sends the user to sign in instead.
 */
export function AdminPageError() {
  const error = useRouteError();
  const { pathname, search } = useLocation();

  if (error instanceof HttpError && error.status === 401) {
    return <Navigate to={loginPath(`${pathname}${search}`)} replace />;
  }

  return (
    <div className={styles.root} role="alert">
      <p className={styles.message}>{getRequestErrorMessage(error, fallbackMessage)}</p>
      {/* A full reload also recovers from a page chunk that is gone after a deploy. */}
      <Button onClick={() => window.location.reload()}>Повторить</Button>
    </div>
  );
}
