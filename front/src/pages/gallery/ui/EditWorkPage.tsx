import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { galleryWorkQuery } from "@/entities/gallery";
import { EditWorkForm, useWorkReferences } from "@/features/edit-gallery";
import { LanguageForm } from "@/features/edit-translations";
import { AwaitPageData } from "@/shared/ui/page-data";

import styles from "./GalleryPage.module.css";
import { WorkFormSkeleton } from "./WorkFormSkeleton";

export function EditWorkPage() {
  const { id = "" } = useParams();

  return (
    <div className={styles.root}>
      {/* Keyed: another work shows its skeleton, then a form of its own, whose values come from
          the work it opened with. */}
      <AwaitPageData key={id} fallback={<WorkFormSkeleton />}>
        <EditWork id={id} />
      </AwaitPageData>
    </div>
  );
}

interface EditWorkProps {
  id: string;
}

function EditWork({ id }: EditWorkProps) {
  const { data: work } = useSuspenseQuery(galleryWorkQuery(id));
  const references = useWorkReferences();

  return (
    <EditWorkForm
      className={styles.form}
      languageForm={LanguageForm}
      work={work}
      references={references}
    />
  );
}
