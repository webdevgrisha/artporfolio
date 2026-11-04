import { CreateWorkForm, useWorkReferences } from "@/features/edit-gallery";
import { AwaitPageData } from "@/shared/ui/page-data";

import styles from "./GalleryPage.module.css";
import { WorkFormSkeleton } from "./WorkFormSkeleton";

export function NewWorkPage() {
  return (
    <div className={styles.root}>
      <AwaitPageData fallback={<WorkFormSkeleton />}>
        <NewWork />
      </AwaitPageData>
    </div>
  );
}

function NewWork() {
  // AwaitPageData has waited for the fresh lists, so this never suspends.
  const references = useWorkReferences();

  return <CreateWorkForm className={styles.form} references={references} />;
}
