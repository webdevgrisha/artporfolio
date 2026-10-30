import { Outlet } from "react-router";

import { routes } from "@/shared/config/routes";
import { ButtonLink } from "@/shared/ui/button";
import { TabNav } from "@/shared/ui/tab-nav";

import styles from "./ProjectsPage.module.css";

const sections = [
  { label: "Основной текст", to: routes.projectsIntro },
  { label: "Все проекты", to: routes.projectsAll },
  { label: "Порядок на сайте", to: routes.projectsOrder },
] as const;

/** The text above the projects, the projects and their order on the site are saved independently. */
export function ProjectsPage() {
  return (
    <div className={styles.root}>
      {/* Adding is an action, not a section: it opens the form of a new project. */}
      <div className={styles.sectionsBar}>
        <TabNav label="Разделы страницы «Проекты»" items={sections} />
        <ButtonLink to={routes.projectNew}>Добавить проект</ButtonLink>
      </div>
      <Outlet />
    </div>
  );
}
