import { useLoaderData } from "react-router";

import { EditContactsForm } from "@/features/edit-contacts";

import type { contactsLoader } from "../model/contactsRoute";
import styles from "./ContactsPage.module.css";

export function ContactsPage() {
  const contacts = useLoaderData<typeof contactsLoader>();

  return (
    <div className={styles.root}>
      <EditContactsForm className={styles.form} contacts={contacts} />
    </div>
  );
}
