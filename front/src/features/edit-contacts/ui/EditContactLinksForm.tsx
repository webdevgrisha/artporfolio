import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";

import type { ContactLinks } from "@/entities/contacts";
import type { Tagged } from "@/shared/api/http";
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
  /** The links as stored on the server when the form opens, with their ETag. */
  links: Tagged<ContactLinks>;
}

export function EditContactLinksForm({ className, links }: EditContactLinksFormProps) {
  // The links the fields were made from. Their ETag goes with the save, so links changed since,
  // for example in another tab, are not overwritten.
  const [savedLinks, setSavedLinks] = React.useState(links);
  const form = useForm<ContactLinksFormValues>({
    defaultValues: links.data,
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

    let saved: Tagged<ContactLinks>;

    try {
      // The server replaces all links at once.
      saved = await saveLinks.mutateAsync({ etag: savedLinks.etag, links: values });
    } catch {
      // The mutation has shown the error; the changes stay, so the save can be repeated.
      return;
    }

    setSavedLinks(saved);
    reset(saved.data);
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
