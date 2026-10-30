import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { type ContactLinks, contactLinksQuery } from "@/entities/contacts";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";

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
  const form = useForm<ContactLinksFormValues>({
    defaultValues: links.data,
    resolver: zodResolver(contactLinksFormSchema),
  });
  const saveLinks = useSaveContactLinks();
  const { editForm } = useSavedForm({
    form,
    initial: links,
    query: contactLinksQuery,
    // The server replaces all links at once.
    save: (values, etag) => saveLinks.mutateAsync({ etag, links: values }),
    toValues: (data) => data,
    toastId: saveContactLinksFeedback.toastId,
  });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <ContactLinksFields isSaving={editForm.isSaving} />
      </EditForm>
    </FormProvider>
  );
}
