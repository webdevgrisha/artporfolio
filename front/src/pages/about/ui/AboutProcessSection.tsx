import { useSuspenseQuery } from "@tanstack/react-query";

import { processPhotosQuery } from "@/entities/about";
import { EditProcessPhotosForm } from "@/features/edit-about";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FormSkeleton, MediaSkeleton } from "@/shared/ui/skeleton";

import styles from "./AboutPage.module.css";

export function AboutProcessSection() {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form}>
          <MediaSkeleton />
        </FormSkeleton>
      }
    >
      <AboutProcess />
    </AwaitPageData>
  );
}

function AboutProcess() {
  const { data: list } = useSuspenseQuery(processPhotosQuery);

  return <EditProcessPhotosForm className={styles.form} list={list} />;
}
