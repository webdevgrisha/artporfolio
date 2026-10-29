import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { flushSync } from "react-dom";
import { type FieldErrors, FormProvider, useForm } from "react-hook-form";

import type { ContactsWithPhoto } from "@/entities/contacts";
import { toSavedPhotoValues } from "@/shared/lib/photoForm";
import { EditForm } from "@/shared/ui/edit-form";
import { PhotoFields } from "@/shared/ui/photo-fields";
import { Tab, TabList, TabPanel, Tabs } from "@/shared/ui/tabs";
import { showSaveResultToast } from "@/shared/ui/toast";

import { contactFields } from "../model/contactFields";
import { getContactsChanges } from "../model/contactsChanges";
import { type ContactsFormValues, contactsFormSchema } from "../model/contactsFormSchema";
import { toContactsFormValues } from "../model/contactsFormValues";
import { useSaveContacts } from "../model/useSaveContacts";
import { ContactLinksFields } from "./ContactLinksFields";

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
  const saveContacts = useSaveContacts();

  async function saveChanges(values: ContactsFormValues) {
    const { error, linksSaved, photoSaved } = await saveContacts.mutateAsync(
      getContactsChanges(values, dirtyFields, contacts),
    );

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

    showSaveResultToast(error, { id: saveToastId });
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
      <EditForm
        className={className}
        hasUnsavedChanges={isDirty}
        isSaving={isSubmitting}
        onRevert={() => reset()}
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
            <PhotoFields label="Фото" isSaving={isSubmitting} serverPhoto={contacts.photo} />
          </TabPanel>
        </Tabs>
      </EditForm>
    </FormProvider>
  );
}
