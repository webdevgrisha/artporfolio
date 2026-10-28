import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import React from "react";
import { flushSync } from "react-dom";
import { type FieldErrors, FormProvider, useForm } from "react-hook-form";

import type { ContactsWithPhoto } from "@/entities/contacts";
import { FormActions } from "@/shared/ui/form-actions";
import { Tab, TabList, TabPanel, Tabs } from "@/shared/ui/tabs";
import { UnsavedChangesDialog } from "@/shared/ui/unsaved-changes-dialog";

import { contactFields } from "../model/contactFields";
import type { ContactsChanges } from "../model/contactsChanges";
import { type ContactsFormValues, contactsFormSchema } from "../model/contactsFormSchema";
import { toContactsFormValues, toPhotoFormValues } from "../model/contactsFormValues";
import { getContactsChanges } from "../model/getContactsChanges";
import type { SaveContactsResult } from "../model/saveContacts";
import { ContactLinksFields } from "./ContactLinksFields";
import { ContactPhotoFields } from "./ContactPhotoFields";
import styles from "./EditContactsForm.module.css";

type ContactsTab = "links" | "photo";

/** The fields that can be invalid, in display order, with the tab that shows each of them. */
const validatedFields: readonly (readonly [keyof ContactsFormValues, ContactsTab])[] = [
  ...contactFields.map((field) => [field.name, "links"] as const),
  ["photoAlt", "photo"],
];

interface EditContactsFormProps {
  className?: string;
  isSaving: boolean;
  onSubmit: (changes: ContactsChanges) => void;
  /** The result of the last save. The parts it returns become the baseline of their fields. */
  saveResult: SaveContactsResult | undefined;
  /** The last saved values, including the parts saved by `saveResult`. */
  savedContacts: ContactsWithPhoto;
}

export function EditContactsForm({
  className,
  isSaving,
  onSubmit,
  saveResult,
  savedContacts,
}: EditContactsFormProps) {
  const form = useForm<ContactsFormValues>({
    defaultValues: toContactsFormValues(savedContacts),
    resolver: zodResolver(contactsFormSchema),
    // A field on a hidden tab cannot take the focus: handleInvalid shows its tab first.
    shouldFocusError: false,
  });
  const {
    formState: { dirtyFields, isDirty },
    handleSubmit,
    reset,
    resetField,
    setFocus,
  } = form;
  const [tab, setTab] = React.useState<ContactsTab>("links");

  // What was saved is no longer modified. A part that failed is not in the result, so its fields
  // keep the unsaved changes.
  React.useEffect(() => {
    if (!saveResult) return;

    const { contacts: savedLinks, photo: savedPhotoValue } = saveResult;

    if (savedLinks) {
      for (const field of contactFields) {
        resetField(field.name, { defaultValue: savedLinks[field.name] });
      }
    }

    if (savedPhotoValue !== undefined) {
      const photoValues = toPhotoFormValues(savedPhotoValue);
      resetField("photo", { defaultValue: photoValues.photo });
      resetField("photoAlt", { defaultValue: photoValues.photoAlt });
    }
  }, [resetField, saveResult]);

  function submitChanges(submittedValues: ContactsFormValues) {
    onSubmit(getContactsChanges(submittedValues, dirtyFields, savedContacts));
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
        onSubmit={handleSubmit(submitChanges, handleInvalid)}
      >
        <Tabs value={tab} onValueChange={setTab}>
          <TabList label="Разделы контактов">
            <Tab value="links">Соц. сети</Tab>
            <Tab value="photo">Фото</Tab>
          </TabList>

          <TabPanel value="links">
            <ContactLinksFields isSaving={isSaving} />
          </TabPanel>
          <TabPanel value="photo">
            <ContactPhotoFields isSaving={isSaving} serverPhoto={savedContacts.photo} />
          </TabPanel>
        </Tabs>

        <FormActions
          className={styles.actions}
          hasUnsavedChanges={isDirty}
          isSaving={isSaving}
          onRevert={() => reset()}
        />
        <UnsavedChangesDialog hasUnsavedChanges={isDirty} />
      </form>
    </FormProvider>
  );
}
