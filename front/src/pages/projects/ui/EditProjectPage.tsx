import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { projectQuery } from "@/entities/project";
import { EditProjectForm } from "@/features/edit-projects";

import { ProjectFormHeader } from "./ProjectFormHeader";
import styles from "./ProjectsPage.module.css";

export function EditProjectPage() {
  const { id = "" } = useParams();
  // The loader of the page has fetched the data, so this never suspends.
  const { data: project } = useSuspenseQuery(projectQuery(id));

  return (
    <div className={styles.root}>
      <ProjectFormHeader title={project.data.title} />
      {/* A form per project: its values come from the project it opened with. */}
      <EditProjectForm key={id} className={styles.form} project={project} />
    </div>
  );
}
