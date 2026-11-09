import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import type { AboutText } from "@/entities/about";
import { type LanguageFormSlot, translationResources } from "@/entities/translation";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";

import { type AboutTextFormValues, aboutTextFormSchema } from "../model/aboutTextFormSchema";
import { saveAboutTextFeedback, useSaveAboutText } from "../model/useSaveAboutText";
import { AboutTextFields } from "./AboutTextFields";

/** The texts of the page a person can edit in every language. */
const languageFields = [
  { key: "about", label: "О себе", multiline: true },
  { key: "biography", label: "Биография", multiline: true },
  { key: "creation", label: "Творчество", multiline: true },
];

interface EditAboutTextFormProps {
  className?: string;
  /** Puts the form beside its translations. */
  languageForm: LanguageFormSlot;
  /** The texts as stored on the server when the form opens, with their ETag. */
  text: Tagged<AboutText>;
}

export function EditAboutTextForm({
  className,
  languageForm: LanguageForm,
  text,
}: EditAboutTextFormProps) {
  const form = useForm<AboutTextFormValues>({
    defaultValues: text.data,
    resolver: zodResolver(aboutTextFormSchema),
  });
  const saveText = useSaveAboutText();
  const { editForm } = useSavedForm({
    form,
    initial: text,
    // The server replaces all texts at once.
    save: (values, etag) => saveText.mutateAsync({ etag, text: values }),
    toValues: (data) => data,
    toastId: saveAboutTextFeedback.toastId,
  });

  return (
    <LanguageForm resource={translationResources.aboutText} fields={languageFields}>
      {/* The fields read the form from the context. */}
      <FormProvider {...form}>
        <EditForm className={className} {...editForm}>
          <AboutTextFields isSaving={editForm.isSaving} />
        </EditForm>
      </FormProvider>
    </LanguageForm>
  );
}
