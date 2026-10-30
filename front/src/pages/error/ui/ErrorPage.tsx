import { useRouteError } from "react-router";

import { getRequestErrorMessage } from "@/shared/api/requestErrorMessages";
import { documentTitle } from "@/shared/lib/documentTitle";
import { Button } from "@/shared/ui/button";

import styles from "./ErrorPage.module.css";

const fallbackMessage = "Что-то пошло не так. Попробуйте ещё раз";

/**
 * Shown in place of the whole app when an error is not handled closer to where it happened: the
 * session check failed, or the admin layout or the login page could not load or crashed.
 */
export function ErrorPage() {
  const error = useRouteError();

  return (
    <main className={styles.root}>
      <title>{documentTitle("Ошибка")}</title>
      <h1 className={styles.message} role="alert">
        {getRequestErrorMessage(error, fallbackMessage)}
      </h1>
      {/* A full reload also recovers from a chunk that is gone after a deploy. */}
      <Button onClick={() => window.location.reload()}>Повторить</Button>
    </main>
  );
}
