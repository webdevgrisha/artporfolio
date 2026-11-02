import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { gallerySectionQuery } from "@/entities/gallery";
import { EditSectionForm } from "@/features/edit-gallery";

import styles from "./GalleryPage.module.css";

export function EditSectionPage() {
  const { id = "" } = useParams();
  // The loader of the page has fetched the data, so this never suspends.
  const { data: section } = useSuspenseQuery(gallerySectionQuery(id));

  return (
    <div className={styles.root}>
      {/* A form per section: its values come from the section it opened with. */}
      <EditSectionForm key={id} className={styles.form} section={section} />
    </div>
  );
}
