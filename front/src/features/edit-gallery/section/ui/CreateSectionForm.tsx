import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { routes } from "@/shared/config/routes";
import { EditForm, useCreateForm } from "@/shared/ui/edit-form";

import {
  emptySectionFormValues,
  type SectionFormValues,
  sectionFormSchema,
} from "../model/sectionFormSchema";
import { useCreateSection } from "../model/useCreateSection";
import { SectionFields } from "./SectionFields";

interface CreateSectionFormProps {
  className?: string;
}

/** A new section; once it is created, the list of sections opens in place of this page. */
export function CreateSectionForm({ className }: CreateSectionFormProps) {
  const form = useForm<SectionFormValues>({
    defaultValues: emptySectionFormValues,
    resolver: zodResolver(sectionFormSchema),
  });
  const editForm = useCreateForm({
    form,
    mutation: useCreateSection(),
    toPath: () => routes.gallerySections,
  });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <SectionFields isSaving={editForm.isSaving} savedSubsections={[]} usages={{}} />
      </EditForm>
    </FormProvider>
  );
}
