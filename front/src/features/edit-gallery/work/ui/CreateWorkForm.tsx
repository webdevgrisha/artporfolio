import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { galleryWorkPath } from "@/shared/config/routes";
import { EditForm, useCreateForm } from "@/shared/ui/edit-form";
import { useCreateWork } from "../model/useCreateWork";
import type { WorkReferences } from "../model/useWorkReferences";
import { type WorkFormValues, workFormSchema } from "../model/workFormSchema";
import { emptyWorkFormValues } from "../model/workFormValues";
import { WorkFields } from "./WorkFields";

interface CreateWorkFormProps {
  className?: string;
  /** The lists of the gallery to choose from. */
  references: WorkReferences;
}

/** A new work; once it is created, its edit page opens in place of this one. */
export function CreateWorkForm({ className, references }: CreateWorkFormProps) {
  const form = useForm<WorkFormValues>({
    defaultValues: emptyWorkFormValues,
    resolver: zodResolver(workFormSchema),
  });
  const editForm = useCreateForm({ form, mutation: useCreateWork(), toPath: galleryWorkPath });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <WorkFields
          isSaving={editForm.isSaving}
          savedPhoto={null}
          savedProcessPhotos={[]}
          references={references}
        />
      </EditForm>
    </FormProvider>
  );
}
