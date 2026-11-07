import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { type AboutText, aboutTextQuery } from "@/entities/about";
import type { Tagged } from "@/shared/api/http";
import { toTranslationsBody } from "@/shared/lib/translationsForm";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { LanguageForm } from "@/shared/ui/language-form";

import {
  type AboutTextFormValues,
  aboutLanguageFields,
  aboutTextFormSchema,
  toAboutTextFormValues,
} from "../model/aboutTextFormSchema";
import { saveAboutTextFeedback, useSaveAboutText } from "../model/useSaveAboutText";
import { AboutTextFields } from "./AboutTextFields";

interface EditAboutTextFormProps {
  className?: string;
  /** The texts as stored on the server when the form opens, with their ETag. */
  text: Tagged<AboutText>;
}

export function EditAboutTextForm({ className, text }: EditAboutTextFormProps) {
  const form = useForm<AboutTextFormValues>({
    defaultValues: toAboutTextFormValues(text.data),
    resolver: zodResolver(aboutTextFormSchema),
  });
  const saveText = useSaveAboutText();
  const { editForm, saved } = useSavedForm({
    form,
    initial: text,
    query: aboutTextQuery,
    // The server replaces all texts at once.
    save: (values, etag) =>
      saveText.mutateAsync({
        etag,
        text: { ...values, translations: toTranslationsBody(values.translations) },
      }),
    toValues: toAboutTextFormValues,
    toastId: saveAboutTextFeedback.toastId,
  });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <LanguageForm
          fields={aboutLanguageFields}
          isSaving={editForm.isSaving}
          saved={saved.data.translations}
        >
          <AboutTextFields isSaving={editForm.isSaving} />
        </LanguageForm>
      </EditForm>
    </FormProvider>
  );
}
