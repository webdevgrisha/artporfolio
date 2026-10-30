import { Outlet } from "react-router";

import { routes } from "@/shared/config/routes";
import { TabNav } from "@/shared/ui/tab-nav";

import styles from "./AboutPage.module.css";

const sections = [
  { label: "Тексты", to: routes.aboutText },
  { label: "Моё фото", to: routes.aboutPhoto },
  { label: "Процесс", to: routes.aboutProcess },
] as const;

/**
 * The texts, «Моё фото» and the process photos are saved independently, so each is a section of
 * its own with its own form and URL.
 */
export function AboutPage() {
  return (
    <div className={styles.root}>
      <TabNav label="Разделы страницы «О сайте»" items={sections} />
      <Outlet />
    </div>
  );
}
