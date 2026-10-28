import React from "react";
import { useFetcher, useLoaderData } from "react-router";

import {
  type ContactsChanges,
  contactsChangesToFormData,
  EditContactsForm,
} from "@/features/edit-contacts";
import { showErrorToast, showSuccessToast } from "@/shared/ui/toast";

import type { contactsAction, contactsLoader } from "../model/contactsRoute";
import styles from "./ContactsPage.module.css";

// One toast for the result of saving: a new result replaces the previous one.
const saveToastId = "contacts-save";

export function ContactsPage() {
  const loadedContacts = useLoaderData<typeof contactsLoader>();
  // A fetcher, not a navigation: saving stays on the page and adds no history entry.
  const fetcher = useFetcher<typeof contactsAction>();
  // Kept apart from fetcher.data, which the next save replaces.
  const [savedContacts, setSavedContacts] = React.useState(loadedContacts);
  const saveResult = fetcher.data;

  React.useEffect(() => {
    if (!saveResult) return;

    const { contacts, photo } = saveResult;

    // Only the saved parts are replaced; the form resets their fields from the same result.
    if (contacts || photo !== undefined) {
      setSavedContacts((previous) => ({
        contacts: contacts ?? previous.contacts,
        photo: photo === undefined ? previous.photo : photo,
      }));
    }

    if (saveResult.error) {
      showErrorToast(saveResult.error, { id: saveToastId });
    } else {
      showSuccessToast("Изменения сохранены", { id: saveToastId });
    }
  }, [saveResult]);

  function handleSubmit(changes: ContactsChanges) {
    void fetcher.submit(contactsChangesToFormData(changes), {
      encType: "multipart/form-data",
      method: "put",
    });
  }

  return (
    <div className={styles.root}>
      <EditContactsForm
        className={styles.form}
        isSaving={fetcher.state !== "idle"}
        saveResult={saveResult}
        savedContacts={savedContacts}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
