import { CreateProjectForm } from "@/features/edit-projects";

import { ProjectFormHeader } from "./ProjectFormHeader";
import styles from "./ProjectsPage.module.css";

export function NewProjectPage() {
  return (
    <div className={styles.root}>
      <ProjectFormHeader title="Новый проект" />
      <CreateProjectForm className={styles.form} />
    </div>
  );
}
