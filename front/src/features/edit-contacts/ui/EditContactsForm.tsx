import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import React from "react";
import { flushSync } from "react-dom";
import { type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { useRevalidator } from "react-router";

import type { ContactsWithPhoto } from "@/entities/contacts";
import { FormActions } from "@/shared/ui/form-actions";
import { Tab, TabList, TabPanel, Tabs } from "@/shared/ui/tabs";
import { showErrorToast, showSuccessToast } from "@/shared/ui/toast";
import { UnsavedChangesDialog } from "@/shared/ui/unsaved-changes-dialog";

import { contactFields } from "../model/contactFields";
import { getContactsChanges } from "../model/contactsChanges";
import { type ContactsFormValues, contactsFormSchema } from "../model/contactsFormSchema";
import { toContactsFormValues, toSavedPhotoValues } from "../model/contactsFormValues";
import { saveContacts } from "../model/saveContacts";
import { ContactLinksFields } from "./ContactLinksFields";
import { ContactPhotoFields } from "./ContactPhotoFields";
import styles from "./EditContactsForm.module.css";

// One toast for the result of saving: a new result replaces the previous one.
const saveToastId = "contacts-save";

type ContactsTab = "links" | "photo";

/** The fields that can be invalid, in display order, with the tab that shows each of them. */
const validatedFields: readonly (readonly [keyof ContactsFormValues, ContactsTab])[] = [
  ...contactFields.map((field) => [field.name, "links"] as const),
  ["photoAlt", "photo"],
];

interface EditContactsFormProps {
  className?: string;
  /** The contacts as stored on the server, from the route loader. */
  contacts: ContactsWithPhoto;
}

export function EditContactsForm({ className, contacts }: EditContactsFormProps) {
  const form = useForm<ContactsFormValues>({
    defaultValues: toContactsFormValues(contacts),
    resolver: zodResolver(contactsFormSchema),
    // A field on a hidden tab cannot take the focus: handleInvalid shows its tab first.
    shouldFocusError: false,
  });
  const {
    formState: { dirtyFields, isDirty, isSubmitting },
    handleSubmit,
    reset,
    resetField,
    setFocus,
  } = form;
  const [tab, setTab] = React.useState<ContactsTab>("links");
  const { revalidate } = useRevalidator();

  async function saveChanges(values: ContactsFormValues) {
    const { error, linksSaved, photoSaved } = await saveContacts(
      getContactsChanges(values, dirtyFields, contacts),
    );

    if (linksSaved || photoSaved) {
      // A saved photo gets new URLs, so the route loads the contacts again.
      await revalidate();
    }

    // What was saved is no longer modified; a part that failed keeps its unsaved changes.
    if (linksSaved) {
      for (const field of contactFields) {
        resetField(field.name, { defaultValue: values[field.name] });
      }
    }

    if (photoSaved) {
      const photoValues = toSavedPhotoValues(values);
      resetField("photo", { defaultValue: photoValues.photo });
      resetField("photoAlt", { defaultValue: photoValues.photoAlt });
    }

    if (error) {
      showErrorToast(error, { id: saveToastId });
    } else {
      showSuccessToast("Изменения сохранены", { id: saveToastId });
    }
  }

  function handleInvalid(fieldErrors: FieldErrors<ContactsFormValues>) {
    const firstInvalid = validatedFields.find(([name]) => fieldErrors[name]);
    if (!firstInvalid) return;

    const [name, fieldTab] = firstInvalid;
    // The tab is rendered synchronously, so its field can take the focus right away.
    flushSync(() => setTab(fieldTab));
    setFocus(name);
  }

  return (
    // The fields of both tabs read the form from the context.
    <FormProvider {...form}>
      <form
        className={clsx(styles.root, className)}
        noValidate
        onSubmit={handleSubmit(saveChanges, handleInvalid)}
      >
        <Tabs value={tab} onValueChange={setTab}>
          <TabList label="Разделы контактов">
            <Tab value="links">Соц. сети</Tab>
            <Tab value="photo">Фото</Tab>
          </TabList>

          <TabPanel value="links">
            <ContactLinksFields isSaving={isSubmitting} />
          </TabPanel>
          <TabPanel value="photo">
            <ContactPhotoFields isSaving={isSubmitting} serverPhoto={contacts.photo} />
          </TabPanel>
        </Tabs>

        <FormActions
          className={styles.actions}
          hasUnsavedChanges={isDirty}
          isSaving={isSubmitting}
          onRevert={() => reset()}
        />
        <UnsavedChangesDialog hasUnsavedChanges={isDirty} />
      </form>
    </FormProvider>
  );
}
