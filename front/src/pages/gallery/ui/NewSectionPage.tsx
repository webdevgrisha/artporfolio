import { CreateSectionForm } from "@/features/edit-gallery";

import styles from "./GalleryPage.module.css";

export function NewSectionPage() {
  return (
    <div className={styles.root}>
      <CreateSectionForm className={styles.form} />
    </div>
  );
}
