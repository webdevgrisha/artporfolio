import { useSuspenseQuery } from "@tanstack/react-query";

import { contactPhoto } from "@/entities/contacts";
import { EditContactPhotoForm } from "@/features/edit-contacts";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FormSkeleton, MediaSkeleton } from "@/shared/ui/skeleton";

import styles from "./ContactsPage.module.css";

export function ContactPhotoSection() {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form}>
          <MediaSkeleton />
        </FormSkeleton>
      }
    >
      <ContactPhoto />
    </AwaitPageData>
  );
}

function ContactPhoto() {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: photo } = useSuspenseQuery(contactPhoto.query);

  return <EditContactPhotoForm className={styles.form} photo={photo} />;
}
