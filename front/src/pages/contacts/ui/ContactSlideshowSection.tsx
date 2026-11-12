import { useSuspenseQuery } from "@tanstack/react-query";

import { slideshowQuery } from "@/entities/contacts";
import { EditSlideshowForm } from "@/features/edit-contact-slideshow";
import { AwaitPageData } from "@/shared/ui/page-data";
import { FormSkeleton, MediaSkeleton } from "@/shared/ui/skeleton";

import styles from "./ContactsPage.module.css";

export function ContactSlideshowSection() {
  return (
    <AwaitPageData
      fallback={
        <FormSkeleton className={styles.form}>
          <MediaSkeleton />
        </FormSkeleton>
      }
    >
      <ContactSlideshow />
    </AwaitPageData>
  );
}

function ContactSlideshow() {
  const { data: slideshow } = useSuspenseQuery(slideshowQuery);

  return <EditSlideshowForm className={styles.form} slideshow={slideshow} />;
}
