import { useRouteError } from "react-router";

import { getRequestErrorMessage } from "@/shared/api/getRequestErrorMessage";
import { Button } from "@/shared/ui/button";

import styles from "./AdminPageError.module.css";

const fallbackMessage = "Не удалось загрузить страницу. Попробуйте ещё раз";

/**
 * Shown in place of an admin page whose data or code failed to load, or which crashed while
 * rendering. The layout stays, so the user can still go to another page.
 */
export function AdminPageError() {
  const error = useRouteError();

  return (
    <div className={styles.root} role="alert">
      <p className={styles.message}>{getRequestErrorMessage(error, fallbackMessage)}</p>
      {/* A full reload also recovers from a page chunk that is gone after a deploy. */}
      <Button onClick={() => window.location.reload()}>Повторить</Button>
    </div>
  );
}
