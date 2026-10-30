import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { type AboutText, aboutTextQuery } from "@/entities/about";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";

import { type AboutTextFormValues, aboutTextFormSchema } from "../model/aboutTextFormSchema";
import { saveAboutTextFeedback, useSaveAboutText } from "../model/useSaveAboutText";
import { AboutTextFields } from "./AboutTextFields";

interface EditAboutTextFormProps {
  className?: string;
  /** The texts as stored on the server when the form opens, with their ETag. */
  text: Tagged<AboutText>;
}

export function EditAboutTextForm({ className, text }: EditAboutTextFormProps) {
  const form = useForm<AboutTextFormValues>({
    defaultValues: text.data,
    resolver: zodResolver(aboutTextFormSchema),
  });
  const saveText = useSaveAboutText();
  const { editForm } = useSavedForm({
    form,
    initial: text,
    query: aboutTextQuery,
    // The server replaces all texts at once.
    save: (values, etag) => saveText.mutateAsync({ etag, text: values }),
    toValues: (data) => data,
    toastId: saveAboutTextFeedback.toastId,
  });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <AboutTextFields isSaving={editForm.isSaving} />
      </EditForm>
    </FormProvider>
  );
}
