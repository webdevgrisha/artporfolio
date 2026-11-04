import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import {
  type GalleryCollection,
  type GalleryWork,
  galleryCollectionQuery,
} from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";

import {
  type CollectionFormValues,
  collectionFormSchema,
  toCollectionFormValues,
} from "../model/collectionFormSchema";
import { saveCollectionToastId, useSaveCollection } from "../model/collectionMutations";
import { CollectionFields } from "./CollectionFields";

interface EditCollectionFormProps {
  className?: string;
  /** The collection as stored on the server when the form opens, with its ETag. */
  collection: Tagged<GalleryCollection>;
  /** Every work of the gallery, in the order the site shows them, to add to the collection. */
  works: readonly GalleryWork[];
}

export function EditCollectionForm({ className, collection, works }: EditCollectionFormProps) {
  const form = useForm<CollectionFormValues>({
    defaultValues: toCollectionFormValues(collection.data),
    resolver: zodResolver(collectionFormSchema),
  });
  const saveCollection = useSaveCollection(collection.data.id);
  const { editForm, saved } = useSavedForm({
    form,
    initial: collection,
    query: galleryCollectionQuery(collection.data.id),
    // The server replaces the whole collection, its cover and its works included, at once.
    save: (values, etag) => saveCollection.mutateAsync({ etag, values }),
    toValues: toCollectionFormValues,
    toastId: saveCollectionToastId,
  });

  return (
    // The fields read the form from the context.
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <CollectionFields
          isSaving={editForm.isSaving}
          savedCover={saved.data.cover}
          works={works}
        />
      </EditForm>
    </FormProvider>
  );
}
