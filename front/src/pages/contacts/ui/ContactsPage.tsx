import { useSuspenseQuery } from "@tanstack/react-query";

import { contactsQuery } from "@/entities/contacts";
import { EditContactsForm } from "@/features/edit-contacts";

import styles from "./ContactsPage.module.css";

export function ContactsPage() {
  // The route loader has fetched the data, so this never suspends.
  const { data: contacts } = useSuspenseQuery(contactsQuery);

  return (
    <div className={styles.root}>
      <EditContactsForm className={styles.form} contacts={contacts} />
    </div>
  );
}
