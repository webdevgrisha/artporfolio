import { useSuspenseQuery } from "@tanstack/react-query";

import { contactLinksQuery } from "@/entities/contacts";
import { EditContactLinksForm, EditContactLinksFormSkeleton } from "@/features/edit-contacts";
import { AwaitPageData } from "@/shared/ui/page-data";

import styles from "./ContactsPage.module.css";

export function ContactLinksSection() {
  return (
    <AwaitPageData fallback={<EditContactLinksFormSkeleton className={styles.form} />}>
      <ContactLinks />
    </AwaitPageData>
  );
}

function ContactLinks() {
  // AwaitPageData has waited for the fresh data, so this never suspends.
  const { data: links } = useSuspenseQuery(contactLinksQuery);

  return <EditContactLinksForm className={styles.form} links={links} />;
}
