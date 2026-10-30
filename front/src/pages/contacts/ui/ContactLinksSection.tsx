import { useSuspenseQuery } from "@tanstack/react-query";

import { contactLinksQuery } from "@/entities/contacts";
import { EditContactLinksForm } from "@/features/edit-contacts";

import styles from "./ContactsPage.module.css";

export function ContactLinksSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: links } = useSuspenseQuery(contactLinksQuery);

  return <EditContactLinksForm className={styles.form} links={links} />;
}
