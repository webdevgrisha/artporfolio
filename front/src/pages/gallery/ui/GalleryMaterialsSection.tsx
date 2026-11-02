import { useSuspenseQuery } from "@tanstack/react-query";

import { galleryMaterialsQuery } from "@/entities/gallery";
import { EditMaterialsForm } from "@/features/edit-gallery";

import styles from "./GalleryPage.module.css";

export function GalleryMaterialsSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: materials } = useSuspenseQuery(galleryMaterialsQuery);

  return <EditMaterialsForm className={styles.form} materials={materials} />;
}
