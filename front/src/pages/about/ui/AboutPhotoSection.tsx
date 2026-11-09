import { useSuspenseQuery } from "@tanstack/react-query";

import { aboutPhoto } from "@/entities/about";
import { EditPhotoForm } from "@/features/edit-photo";
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
  const { data: photo } = useSuspenseQuery(aboutPhoto.query);

  return (
    <EditPhotoForm
      altPlaceholder="Например: Анастасия в мастерской"
      className={styles.form}
      label="Моё фото"
      photo={photo}
      slot={aboutPhoto}
    />
  );
}
