import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import type { Project } from "@/entities/project";
import { projectPath } from "@/shared/config/routes";
import { afterSaveState } from "@/shared/lib/useUnsavedChangesGuard";
import { EditForm } from "@/shared/ui/edit-form";

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
  const form = useForm<ProjectFormValues>({
    defaultValues: emptyProjectFormValues,
    resolver: zodResolver(projectFormSchema),
  });
  const createProject = useCreateProject();
  const {
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
  } = form;

  async function create(values: ProjectFormValues) {
    let project: Project;

    try {
      project = await createProject.mutateAsync(values);
    } catch {
      // The mutation has shown the error; the values stay for another try.
      return;
    }

    // Back from the edit page leads to the list, not to an empty form again.
    await navigate(projectPath(project.id), { replace: true, state: afterSaveState });
  }

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm
        className={className}
        // A new project never conflicts with another version.
        conflict={{ isOpen: false, onKeep: () => {}, onTakeLatest: () => {} }}
        hasUnsavedChanges={isDirty}
        isSaving={isSubmitting}
        onRevert={() => reset()}
        onSubmit={handleSubmit(create)}
      >
        <ProjectFields isSaving={isSubmitting} savedPhotos={[]} />
      </EditForm>
    </FormProvider>
  );
}
