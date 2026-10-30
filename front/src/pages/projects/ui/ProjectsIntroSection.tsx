import { useSuspenseQuery } from "@tanstack/react-query";

import { projectsIntroQuery } from "@/entities/project";
import { EditProjectsIntroForm } from "@/features/edit-projects";

import styles from "./ProjectsPage.module.css";

export function ProjectsIntroSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: intro } = useSuspenseQuery(projectsIntroQuery);

  return <EditProjectsIntroForm className={styles.form} intro={intro} />;
}
