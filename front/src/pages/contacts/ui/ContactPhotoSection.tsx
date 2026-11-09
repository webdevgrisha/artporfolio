import { useSuspenseQuery } from "@tanstack/react-query";

import { contactPhoto } from "@/entities/contacts";
import { EditPhotoForm } from "@/features/edit-photo";
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
  const { data: photo } = useSuspenseQuery(contactPhoto.query);

  return (
    <EditPhotoForm
      altPlaceholder="Например: Анастасия в мастерской"
      className={styles.form}
      label="Фото"
      photo={photo}
      slot={contactPhoto}
    />
  );
}
