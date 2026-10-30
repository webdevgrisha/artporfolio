import { Link } from "react-router";

import { routes } from "@/shared/config/routes";
import { ArrowLeftIcon } from "@/shared/ui/icon";

import styles from "./ProjectsPage.module.css";

interface ProjectFormHeaderProps {
  title: string;
}

/** The way back to the list, and what the form is about. */
export function ProjectFormHeader({ title }: ProjectFormHeaderProps) {
  return (
    <div className={styles.header}>
      <Link className={styles.back} to={routes.projectsAll}>
        <ArrowLeftIcon className={styles.backIcon} />
        Все проекты
      </Link>
      <h2 className={styles.heading}>{title}</h2>
    </div>
  );
}
