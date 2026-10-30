import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import type { Contacts } from "@/entities/contacts";
import { EditForm } from "@/shared/ui/edit-form";
import { savedMessage, showSuccessToast } from "@/shared/ui/toast";

import {
  type ContactLinksFormValues,
  contactLinksFormSchema,
} from "../model/contactLinksFormSchema";
import { saveContactLinksFeedback, useSaveContactLinks } from "../model/useSaveContactLinks";
import { ContactLinksFields } from "./ContactLinksFields";

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
    if (!isDirty) {
      showSuccessToast(savedMessage, { id: saveContactLinksFeedback.toastId });
      return;
    }

    try {
      // The server replaces all links at once.
      await saveLinks.mutateAsync(values);
    } catch {
      // The mutation has shown the error; the changes stay, so the save can be repeated.
      return;
    }

    reset(values);
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
