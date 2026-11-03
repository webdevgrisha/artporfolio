import { useSuspenseQuery } from "@tanstack/react-query";

import { aboutPhoto } from "@/entities/about";
import { EditAboutPhotoForm } from "@/features/edit-about";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FormSkeleton, MediaSkeleton } from "@/shared/ui/skeleton";

import styles from "./AboutPage.module.css";

export function AboutPhotoSection() {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form}>
          <MediaSkeleton />
        </FormSkeleton>
      }
    >
      <AboutPhoto />
    </AwaitPageData>
  );
}

function AboutPhoto() {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: photo } = useSuspenseQuery(aboutPhoto.query);

  return <EditAboutPhotoForm className={styles.form} photo={photo} />;
}
