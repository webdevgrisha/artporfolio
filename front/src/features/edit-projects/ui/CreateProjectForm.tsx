import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { projectPath } from "@/shared/config/routes";
import { EditForm, useCreateForm } from "@/shared/ui/edit-form";

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
  const form = useForm<ProjectFormValues>({
    defaultValues: emptyProjectFormValues,
    resolver: zodResolver(projectFormSchema),
  });
  const editForm = useCreateForm({ form, mutation: useCreateProject(), toPath: projectPath });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <ProjectFields isSaving={editForm.isSaving} savedPhotos={[]} />
      </EditForm>
    </FormProvider>
  );
}
