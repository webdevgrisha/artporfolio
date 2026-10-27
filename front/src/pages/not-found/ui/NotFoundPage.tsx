import { useLocation } from "react-router";

import portrait from "@/shared/assets/images/portraitMark.png";
import { adminHomePath } from "@/shared/config/routes";
import { documentTitle } from "@/shared/lib/documentTitle";
import { ButtonLink } from "@/shared/ui/button";

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
            <img src={portrait} alt="" />
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
