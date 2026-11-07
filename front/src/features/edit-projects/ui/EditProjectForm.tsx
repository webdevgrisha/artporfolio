import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { type Project, projectQuery } from "@/entities/project";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { LanguageForm } from "@/shared/ui/language-form";
import {
  type ProjectFormValues,
  projectFormSchema,
  toProjectFormValues,
} from "../model/projectFormSchema";
import { saveProjectToastId, useSaveProject } from "../model/projectMutations";
import { ProjectFields } from "./ProjectFields";

/** The texts of a project a person can edit in every language. */
const languageFields = [
  { key: "title", label: "Название" },
  { key: "description", label: "Описание", multiline: true },
];

interface EditProjectFormProps {
  className?: string;
  /** The project as stored on the server when the form opens, with its ETag. */
  project: Tagged<Project>;
}

export function EditProjectForm({ className, project }: EditProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    defaultValues: toProjectFormValues(project.data),
    resolver: zodResolver(projectFormSchema),
  });
  const saveProject = useSaveProject(project.data.id);
  const { editForm, saved } = useSavedForm({
    form,
    initial: project,
    query: projectQuery(project.data.id),
    // The server replaces the whole project, its photos included, at once.
    save: (values, etag) => saveProject.mutateAsync({ etag, values }),
    toValues: toProjectFormValues,
    toastId: saveProjectToastId,
  });

  return (
    <LanguageForm resource={`project-${project.data.id}`} fields={languageFields}>
      {/* The fields read the form from the context. */}
      <FormProvider {...form}>
        <EditForm className={className} {...editForm}>
          <ProjectFields isSaving={editForm.isSaving} savedPhotos={saved.data.photos} />
        </EditForm>
      </FormProvider>
    </LanguageForm>
  );
}
