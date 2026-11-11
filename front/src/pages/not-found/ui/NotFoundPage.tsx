import { useLocation } from "react-router";

import { adminHomePath } from "@/shared/config/routes";
import { documentTitle } from "@/shared/lib/documentTitle";
import { ButtonLink } from "@/shared/ui/button";
import { Portrait } from "@/shared/ui/portrait";

import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  const { pathname } = useLocation();
  const homePath = pathname === "/admin" || pathname.startsWith("/admin/") ? adminHomePath : "/";

  return (
    <main className={styles.page}>
      <title>{documentTitle("Page not found")}</title>
      <div className={styles.content}>
        <div className={styles.code} aria-hidden="true">
          <span>4</span>
          <span className={styles.portrait}>
            {/* At most 0.7 of the largest digits, 10.5rem. */}
            <Portrait sizes="10.5rem" />
          </span>
          <span>4</span>
        </div>

        <h1 className={styles.message} lang="en">
          Page not found
        </h1>

        <ButtonLink className={styles.backButton} to={homePath} lang="en">
          TAKE ME HOME
        </ButtonLink>
      </div>
    </main>
  );
}
