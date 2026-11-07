import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import type { GalleryWorkSummary } from "@/entities/gallery";
import { galleryCollectionPath } from "@/shared/config/routes";
import { EditForm, useCreateForm } from "@/shared/ui/edit-form";

import {
  type CollectionFormValues,
  collectionFormSchema,
  emptyCollectionFormValues,
} from "../model/collectionFormSchema";
import { useCreateCollection } from "../model/collectionMutations";
import { CollectionFields } from "./CollectionFields";

interface CreateCollectionFormProps {
  className?: string;
  /** Every work of the gallery, in the order the site shows them, to add to the collection. */
  works: readonly GalleryWorkSummary[];
}

/** A new collection; once it is created, its edit page opens in place of this one. */
export function CreateCollectionForm({ className, works }: CreateCollectionFormProps) {
  const form = useForm<CollectionFormValues>({
    defaultValues: emptyCollectionFormValues,
    resolver: zodResolver(collectionFormSchema),
  });
  const editForm = useCreateForm({
    form,
    mutation: useCreateCollection(),
    toPath: galleryCollectionPath,
  });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <CollectionFields isSaving={editForm.isSaving} savedCover={null} works={works} />
      </EditForm>
    </FormProvider>
  );
}
