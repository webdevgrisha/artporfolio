import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";

import type { AboutText } from "@/entities/about";
import type { Tagged } from "@/shared/api/http";
import { EditForm } from "@/shared/ui/edit-form";
import { savedMessage, showSuccessToast } from "@/shared/ui/toast";

import { type AboutTextFormValues, aboutTextFormSchema } from "../model/aboutTextFormSchema";
import { saveAboutTextFeedback, useSaveAboutText } from "../model/useSaveAboutText";
import { AboutTextFields } from "./AboutTextFields";

interface EditAboutTextFormProps {
  className?: string;
  /** The texts as stored on the server when the form opens, with their ETag. */
  text: Tagged<AboutText>;
}

export function EditAboutTextForm({ className, text }: EditAboutTextFormProps) {
  // The texts the fields were made from. Their ETag goes with the save, so texts changed since,
  // for example in another tab, are not overwritten.
  const [savedText, setSavedText] = React.useState(text);
  const form = useForm<AboutTextFormValues>({
    defaultValues: text.data,
    resolver: zodResolver(aboutTextFormSchema),
  });
  const {
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
  } = form;
  const saveText = useSaveAboutText();

  async function saveChanges(values: AboutTextFormValues) {
    if (!isDirty) {
      showSuccessToast(savedMessage, { id: saveAboutTextFeedback.toastId });
      return;
    }

    let saved: Tagged<AboutText>;

    try {
      // The server replaces all texts at once.
      saved = await saveText.mutateAsync({ etag: savedText.etag, text: values });
    } catch {
      // The mutation has shown the error; the changes stay, so the save can be repeated.
      return;
    }

    setSavedText(saved);
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
        <AboutTextFields isSaving={isSubmitting} />
      </EditForm>
    </FormProvider>
  );
}
