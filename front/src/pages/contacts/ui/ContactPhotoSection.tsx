import { useSuspenseQuery } from "@tanstack/react-query";

import { contactPhoto } from "@/entities/contacts";
import { EditContactPhotoForm } from "@/features/edit-contacts";

import styles from "./ContactsPage.module.css";

export function ContactPhotoSection() {
  // The loader of the section has fetched the data, so this never suspends.
  const { data: photo } = useSuspenseQuery(contactPhoto.query);

  return <EditContactPhotoForm className={styles.form} photo={photo} />;
}
