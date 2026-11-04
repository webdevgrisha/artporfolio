import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import {
  type GalleryCollection,
  type GalleryColor,
  type GalleryMaterial,
  type GalleryPalette,
  type GallerySection,
  type GalleryWork,
  galleryWorkQuery,
} from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { toWorkFormValues, type WorkFormValues, workFormSchema } from "../model/workFormSchema";
import { saveWorkToastId, useSaveWork } from "../model/workMutations";
import { WorkFields } from "./WorkFields";

interface EditWorkFormProps {
  className?: string;
  /** The work as stored on the server when the form opens, with its ETag. */
  work: Tagged<GalleryWork>;
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

export function EditWorkForm({
  className,
  collections,
  colors,
  materials,
  palettes,
  sections,
  work,
}: EditWorkFormProps) {
  const form = useForm<WorkFormValues>({
    defaultValues: toWorkFormValues(work.data),
    resolver: zodResolver(workFormSchema),
  });
  const saveWork = useSaveWork(work.data.id);
  const { editForm, saved } = useSavedForm({
    form,
    initial: work,
    query: galleryWorkQuery(work.data.id),
    // The server replaces the whole work, its photos included, at once.
    save: (values, etag) => saveWork.mutateAsync({ etag, values }),
    toValues: toWorkFormValues,
    toastId: saveWorkToastId,
  });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <WorkFields
          isSaving={editForm.isSaving}
          savedPhoto={saved.data.photo}
          savedProcessPhotos={saved.data.processPhotos}
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
