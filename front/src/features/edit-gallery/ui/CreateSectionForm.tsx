import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import { routes } from "@/shared/config/routes";
import { EditForm } from "@/shared/ui/edit-form";
import { useAllowNextNavigation } from "@/shared/ui/unsaved-changes";

import {
  emptySectionFormValues,
  type SectionFormValues,
  sectionFormSchema,
} from "../model/sectionFormSchema";
import { useCreateSection } from "../model/sectionMutations";
import { SectionFields } from "./SectionFields";

interface CreateSectionFormProps {
  className?: string;
}

/** A new section; once it is created, the list of sections opens in place of this page. */
export function CreateSectionForm({ className }: CreateSectionFormProps) {
  const navigate = useNavigate();
  const allowNextNavigation = useAllowNextNavigation();
  // Every try of this form creates the same section, so a retry after a lost response never
  // creates a second one.
  const [id] = React.useState(() => crypto.randomUUID());
  const form = useForm<SectionFormValues>({
    defaultValues: emptySectionFormValues,
    resolver: zodResolver(sectionFormSchema),
  });
  const createSection = useCreateSection();
  const {
    formState: { isDirty },
    handleSubmit,
    reset,
  } = form;
  const isSaving = createSection.isPending;

  function create(values: SectionFormValues) {
    // On failure the mutation shows the error and the values stay for another try.
    createSection.mutate(
      { id, values },
      {
        // Called only while this form is open: once the user has left it, the created section
        // just appears in the list.
        onSuccess: () => {
          allowNextNavigation(routes.gallerySections);
          // Back from the list leads where the user came from, not to an empty form again.
          void navigate(routes.gallerySections, { replace: true });
        },
      },
    );
  }

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm
        className={className}
        hasUnsavedChanges={isDirty}
        isSaving={isSaving}
        onRevert={() => reset()}
        onSubmit={handleSubmit(create)}
      >
        <SectionFields isSaving={isSaving} savedSubsections={[]} works={[]} />
      </EditForm>
    </FormProvider>
  );
}
