import { useLocation } from "react-router";

import portrait from "@/assets/images/portraitMark.png";
import { ButtonLink } from "@/components/Button/Button";
import { documentTitle } from "@/config/documentTitle";
import { adminHomePath } from "@/pages/Admin/config/pages";
import styles from "./NotFound.module.css";

export function NotFound() {
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
