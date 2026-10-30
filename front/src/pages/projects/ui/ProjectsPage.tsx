import { Outlet } from "react-router";

import { routes } from "@/shared/config/routes";
import { TabNav } from "@/shared/ui/tab-nav";

import styles from "./ProjectsPage.module.css";

const sections = [
  { label: "Основной текст", to: routes.projectsIntro },
  { label: "Все проекты", to: routes.projectsAll },
] as const;

/** The text above the projects and the list of projects are saved independently. */
export function ProjectsPage() {
  return (
    <div className={styles.root}>
      <TabNav label="Разделы страницы «Проекты»" items={sections} />
      <Outlet />
    </div>
  );
}
