import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import { isPreconditionFailed } from "@/shared/api/httpError";
import { galleryWorkPath } from "@/shared/config/routes";
import { EditForm } from "@/shared/ui/edit-form";
import { useAllowNextNavigation } from "@/shared/ui/unsaved-changes";
import type { WorkReferences } from "../model/useWorkReferences";
import { emptyWorkFormValues, type WorkFormValues, workFormSchema } from "../model/workFormSchema";
import { useCreateWork } from "../model/workMutations";
import { WorkFields } from "./WorkFields";

interface CreateWorkFormProps {
  className?: string;
  /** The lists of the gallery to choose from. */
  references: WorkReferences;
}

/** A new work; once it is created, its edit page opens in place of this one. */
export function CreateWorkForm({ className, references }: CreateWorkFormProps) {
  const navigate = useNavigate();
  const allowNextNavigation = useAllowNextNavigation();
  // Every try of this form creates the same work, so a retry after a lost response never creates
  // a second one.
  const [id] = React.useState(() => crypto.randomUUID());
  const form = useForm<WorkFormValues>({
    defaultValues: emptyWorkFormValues,
    resolver: zodResolver(workFormSchema),
  });
  const createWork = useCreateWork();
  const {
    formState: { isDirty },
    handleSubmit,
    reset,
  } = form;
  const isSaving = createWork.isPending;

  function openCreated() {
    const path = galleryWorkPath(id);

    allowNextNavigation(path);
    // Back from the edit page leads to the list, not to an empty form again.
    void navigate(path, { replace: true });
  }

  function create(values: WorkFormValues) {
    // On failure the mutation shows the error and the values stay for another try; if an earlier
    // try already saved the data, its response was lost, so the saved data opens.
    createWork.mutate(
      { id, values },
      {
        onError: (error) => {
          if (isPreconditionFailed(error)) openCreated();
        },
        // Called only while this form is open: once the user has left it, perhaps for another new
        // work, the created one just appears in the list.
        onSuccess: openCreated,
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
        <WorkFields
          isSaving={isSaving}
          savedPhoto={null}
          savedProcessPhotos={[]}
          references={references}
        />
      </EditForm>
    </FormProvider>
  );
}
