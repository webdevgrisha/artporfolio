import { useSuspenseQuery } from "@tanstack/react-query";

import { contactsQuery } from "@/entities/contacts";
import { EditContactPhotoForm } from "@/features/edit-contacts";

import styles from "./ContactsPage.module.css";

export function ContactPhotoSection() {
  // The loader of the page has fetched the data, so this never suspends.
  const { data } = useSuspenseQuery(contactsQuery);

  return <EditContactPhotoForm className={styles.form} photo={data.photo} />;
}
