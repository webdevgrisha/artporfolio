import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import type { AboutText } from "@/entities/about";
import { EditForm } from "@/shared/ui/edit-form";
import { savedMessage, showSuccessToast } from "@/shared/ui/toast";

import {
  type AboutTextFormValues,
  aboutTextFormSchema,
  toAboutTextFormValues,
} from "../model/aboutTextFormSchema";
import { saveAboutTextFeedback, useSaveAboutText } from "../model/useSaveAboutText";
import { AboutTextFields } from "./AboutTextFields";

interface EditAboutTextFormProps {
  className?: string;
  /** The texts as stored on the server; `null` until they are first saved. */
  text: AboutText | null;
}

export function EditAboutTextForm({ className, text }: EditAboutTextFormProps) {
  const form = useForm<AboutTextFormValues>({
    defaultValues: toAboutTextFormValues(text),
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

    try {
      // The server replaces all texts at once.
      await saveText.mutateAsync(values);
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
        <AboutTextFields isSaving={isSubmitting} />
      </EditForm>
    </FormProvider>
  );
}
