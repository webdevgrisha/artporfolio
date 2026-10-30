import { useSuspenseQuery } from "@tanstack/react-query";

import { contactsQuery } from "@/entities/contacts";
import { EditContactLinksForm } from "@/features/edit-contacts";

import styles from "./ContactsPage.module.css";

export function ContactLinksSection() {
  // The loader of the page has fetched the data, so this never suspends.
  const { data } = useSuspenseQuery(contactsQuery);

  return <EditContactLinksForm className={styles.form} links={data.links} />;
}
