import { useRouteError } from "react-router";

import { HttpError } from "@/shared/api/httpError";
import { Button } from "@/shared/ui/button";

import styles from "./AdminPageError.module.css";

const networkMessage = "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз";
const unavailableMessage = "Сервис временно недоступен. Попробуйте позже";
const fallbackMessage = "Не удалось загрузить страницу. Попробуйте ещё раз";

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpError && error.status >= 500) {
    return unavailableMessage;
  }

  // fetch rejects with a TypeError when the request never reaches the server; a failed lazy import
  // of a page chunk is a TypeError too.
  if (error instanceof TypeError) {
    return networkMessage;
  }

  return fallbackMessage;
}

/**
 * Shown in place of an admin page whose data or code failed to load, or which crashed while
 * rendering. The layout stays, so the user can still go to another page.
 */
export function AdminPageError() {
  const error = useRouteError();

  return (
    <div className={styles.root} role="alert">
      <p className={styles.message}>{getErrorMessage(error)}</p>
      {/* A full reload also recovers from a page chunk that is gone after a deploy. */}
      <Button onClick={() => window.location.reload()}>Повторить</Button>
    </div>
  );
}
