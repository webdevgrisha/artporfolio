import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import { projectPath } from "@/shared/config/routes";
import { EditForm } from "@/shared/ui/edit-form";
import { useAllowNextNavigation } from "@/shared/ui/unsaved-changes";

import {
  emptyProjectFormValues,
  type ProjectFormValues,
  projectFormSchema,
} from "../model/projectFormSchema";
import { useCreateProject } from "../model/projectMutations";
import { ProjectFields } from "./ProjectFields";

interface CreateProjectFormProps {
  className?: string;
}

/** A new project; once it is created, its edit page opens in place of this one. */
export function CreateProjectForm({ className }: CreateProjectFormProps) {
  const navigate = useNavigate();
  const allowNextNavigation = useAllowNextNavigation();
  // Every try of this form creates the same project, so a retry after a lost response never
  // creates a second one.
  const [id] = React.useState(() => crypto.randomUUID());
  const form = useForm<ProjectFormValues>({
    defaultValues: emptyProjectFormValues,
    resolver: zodResolver(projectFormSchema),
  });
  const createProject = useCreateProject();
  const {
    formState: { isDirty },
    handleSubmit,
    reset,
  } = form;
  const isSaving = createProject.isPending;

  function create(values: ProjectFormValues) {
    // On failure the mutation shows the error and the values stay for another try.
    createProject.mutate(
      { id, values },
      {
        // Called only while this form is open: once the user has left it, perhaps for another new
        // project, the created one just appears in the list.
        onSuccess: (project) => {
          const path = projectPath(project.id);

          allowNextNavigation(path);
          // Back from the edit page leads to the list, not to an empty form again.
          void navigate(path, { replace: true });
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
        <ProjectFields isSaving={isSaving} savedPhotos={[]} />
      </EditForm>
    </FormProvider>
  );
}
