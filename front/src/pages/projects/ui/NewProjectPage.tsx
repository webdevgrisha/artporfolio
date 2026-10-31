import { CreateProjectForm } from "@/features/edit-projects";

import styles from "./ProjectsPage.module.css";

export function NewProjectPage() {
  return (
    <div className={styles.root}>
      <CreateProjectForm className={styles.form} />
    </div>
  );
}
