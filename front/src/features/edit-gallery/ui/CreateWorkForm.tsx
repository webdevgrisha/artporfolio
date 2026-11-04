import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import type {
  GalleryCollection,
  GalleryColor,
  GalleryMaterial,
  GalleryPalette,
  GallerySection,
} from "@/entities/gallery";
import { galleryWorkPath } from "@/shared/config/routes";
import { EditForm } from "@/shared/ui/edit-form";
import { useAllowNextNavigation } from "@/shared/ui/unsaved-changes";
import { emptyWorkFormValues, type WorkFormValues, workFormSchema } from "../model/workFormSchema";
import { useCreateWork } from "../model/workMutations";
import { WorkFields } from "./WorkFields";

interface CreateWorkFormProps {
  className?: string;
  /** The sections of the gallery, to choose from. */
  sections: readonly GallerySection[];
  /** The materials of the gallery, to choose from. */
  materials: readonly GalleryMaterial[];
  /** The colors of the gallery, to choose from. */
  colors: readonly GalleryColor[];
  /** The palettes of the gallery, to choose from. */
  palettes: readonly GalleryPalette[];
  /** The collections of the gallery, to choose from. */
  collections: readonly GalleryCollection[];
}

/** A new work; once it is created, its edit page opens in place of this one. */
export function CreateWorkForm({
  className,
  collections,
  colors,
  materials,
  palettes,
  sections,
}: CreateWorkFormProps) {
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

  function create(values: WorkFormValues) {
    // On failure the mutation shows the error and the values stay for another try.
    createWork.mutate(
      { id, values },
      {
        // Called only while this form is open: once the user has left it, perhaps for another new
        // work, the created one just appears in the list.
        onSuccess: (work) => {
          const path = galleryWorkPath(work.id);

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
        <WorkFields
          isSaving={isSaving}
          savedPhoto={null}
          savedProcessPhotos={[]}
          sections={sections}
          materials={materials}
          colors={colors}
          palettes={palettes}
          collections={collections}
        />
      </EditForm>
    </FormProvider>
  );
}
