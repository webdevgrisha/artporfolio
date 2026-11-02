import { useSuspenseQuery } from "@tanstack/react-query";

import { projectsOrderQuery, projectsQuery } from "@/entities/project";
import { EditProjectsOrderForm } from "@/features/edit-projects";

import styles from "./ProjectsPage.module.css";

export function ProjectsOrderSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: projects } = useSuspenseQuery(projectsQuery);
  const { data: order } = useSuspenseQuery(projectsOrderQuery);

  return <EditProjectsOrderForm className={styles.form} order={order} projects={projects} />;
}
