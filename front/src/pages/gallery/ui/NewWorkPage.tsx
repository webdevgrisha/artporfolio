import { CreateWorkForm } from "@/features/edit-gallery";

import styles from "./GalleryPage.module.css";

export function NewWorkPage() {
  return (
    <div className={styles.root}>
      <CreateWorkForm className={styles.form} />
    </div>
  );
}
