import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import type { Contacts } from "@/entities/contacts";
import { EditForm } from "@/shared/ui/edit-form";
import { showSaveResultToast } from "@/shared/ui/toast";

import { getSaveContactLinksErrorMessage } from "../lib/saveErrorMessages";
import {
  type ContactLinksFormValues,
  contactLinksFormSchema,
} from "../model/contactLinksFormSchema";
import { useSaveContactLinks } from "../model/useSaveContactLinks";
import { ContactLinksFields } from "./ContactLinksFields";

// One toast for the result of saving: a new result replaces the previous one.
const saveToastId = "contact-links-save";

interface EditContactLinksFormProps {
  className?: string;
  /** The links as stored on the server. */
  contacts: Contacts;
}

export function EditContactLinksForm({ className, contacts }: EditContactLinksFormProps) {
  const form = useForm<ContactLinksFormValues>({
    defaultValues: contacts,
    resolver: zodResolver(contactLinksFormSchema),
  });
  const {
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
  } = form;
  const saveLinks = useSaveContactLinks();

  async function saveChanges(values: ContactLinksFormValues) {
    try {
      // The server replaces all links at once.
      if (isDirty) await saveLinks.mutateAsync(values);
    } catch (error) {
      // The changes stay, so the save can be repeated.
      showSaveResultToast(getSaveContactLinksErrorMessage(error), { id: saveToastId });
      return;
    }

    reset(values);
    showSaveResultToast(undefined, { id: saveToastId });
  }

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm
        className={className}
        hasUnsavedChanges={isDirty}
        isSaving={isSubmitting}
        onRevert={() => reset()}
        onSubmit={handleSubmit(saveChanges)}
      >
        <ContactLinksFields isSaving={isSubmitting} />
      </EditForm>
    </FormProvider>
  );
}
