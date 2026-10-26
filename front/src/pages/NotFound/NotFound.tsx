import { useLocation } from "react-router";

import portrait from "@/assets/images/portraitMark.png";
import { ButtonLink } from "@/components/Button/Button";
import styles from "./NotFound.module.css";

export function NotFound() {
  const { pathname } = useLocation();
  const homePath =
    pathname === "/admin" || pathname.startsWith("/admin/") ? "/admin/projects" : "/";

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.code} aria-label="404">
          <span aria-hidden="true">4</span>
          <span className={styles.portrait} aria-hidden="true">
            <img src={portrait} alt="" />
          </span>
          <span aria-hidden="true">4</span>
        </h1>

        <p className={styles.message} lang="en">
          Page not found
        </p>

        <ButtonLink className={styles.backButton} to={homePath} lang="en">
          TAKE ME HOME
        </ButtonLink>
      </div>
    </main>
  );
}
