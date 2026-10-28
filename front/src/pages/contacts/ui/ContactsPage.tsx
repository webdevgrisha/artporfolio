import React from "react";
import { useFetcher, useLoaderData } from "react-router";

import { type ContactsFormValues, EditContactsForm } from "@/features/edit-contacts";
import { showErrorToast, showSuccessToast } from "@/shared/ui/toast";

import type { contactsAction, contactsLoader } from "../model/contactsRoute";
import styles from "./ContactsPage.module.css";

export function ContactsPage() {
  const loadedContacts = useLoaderData<typeof contactsLoader>();
  // A fetcher, not a navigation: saving stays on the page and adds no history entry.
  const fetcher = useFetcher<typeof contactsAction>();
  // Kept apart from fetcher.data, which a failed save replaces.
  const [savedContacts, setSavedContacts] = React.useState(loadedContacts);
  const saveResult = fetcher.data;

  React.useEffect(() => {
    if (!saveResult) return;

    if (saveResult.ok) {
      setSavedContacts(saveResult.contacts);
      showSuccessToast("Изменения сохранены");
    } else {
      showErrorToast(saveResult.error);
    }
  }, [saveResult]);

  function handleSubmit(values: ContactsFormValues) {
    void fetcher.submit(values, { encType: "application/json", method: "put" });
  }

  return (
    <div className={styles.root}>
      <EditContactsForm
        className={styles.form}
        isSaving={fetcher.state !== "idle"}
        savedContacts={savedContacts}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
