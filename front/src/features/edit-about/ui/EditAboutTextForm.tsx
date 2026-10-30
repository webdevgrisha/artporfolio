import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import type { AboutText } from "@/entities/about";
import { EditForm } from "@/shared/ui/edit-form";
import { showSaveResultToast } from "@/shared/ui/toast";

import { getSaveTextErrorMessage } from "../lib/saveErrorMessages";
import {
  type AboutTextFormValues,
  aboutTextFormSchema,
  toAboutTextFormValues,
} from "../model/aboutTextFormSchema";
import { useSaveAboutText } from "../model/useSaveAboutText";
import { AboutTextFields } from "./AboutTextFields";

// One toast for the result of saving: a new result replaces the previous one.
const saveToastId = "about-text-save";

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
    try {
      // The server replaces all texts at once.
      if (isDirty) await saveText.mutateAsync(values);
    } catch (error) {
      // The changes stay, so the save can be repeated.
      showSaveResultToast(getSaveTextErrorMessage(error), { id: saveToastId });
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
        <AboutTextFields isSaving={isSubmitting} />
      </EditForm>
    </FormProvider>
  );
}
