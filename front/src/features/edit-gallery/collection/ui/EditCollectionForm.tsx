import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import {
  type GalleryCollection,
  type GalleryWorkSummary,
  galleryCollectionQuery,
  galleryCollectionsQuery,
  galleryWorksQuery,
} from "@/entities/gallery";
import { type LanguageFormSlot, translationResources } from "@/entities/translation";
import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";

import {
  type CollectionFormValues,
  collectionFormSchema,
  toCollectionFormValues,
} from "../model/collectionFormSchema";
import { saveCollectionToastId, useSaveCollection } from "../model/useSaveCollection";
import { CollectionFields } from "./CollectionFields";

/** The texts of a collection a person can edit in every language. */
const languageFields = [
  { key: "title", label: "Название" },
  { key: "description", label: "Описание", multiline: true },
  { key: "alt", label: "Описание обложки" },
];

interface EditCollectionFormProps {
  className?: string;
  /** Puts the form beside its translations. */
  languageForm: LanguageFormSlot;
  /** The collection as stored on the server when the form opens, with its ETag. */
  collection: Tagged<GalleryCollection>;
  /** Every work of the gallery, in the order the site shows them, to add to the collection. */
  works: readonly GalleryWorkSummary[];
}

export function EditCollectionForm({
  className,
  languageForm: LanguageForm,
  collection,
  works,
}: EditCollectionFormProps) {
  const form = useForm<CollectionFormValues>({
    defaultValues: toCollectionFormValues(collection.data),
    resolver: zodResolver(collectionFormSchema),
  });
  const saveCollection = useSaveCollection(collection.data.id);
  const { editForm, saved } = useSavedForm({
    form,
    initial: collection,
    query: galleryCollectionQuery(collection.data.id),
    // A work added in another tab must show among the works of the latest version.
    related: [galleryWorksQuery.queryKey, galleryCollectionsQuery.queryKey],
    // The server replaces the whole collection, its cover and its works included, at once.
    save: (values, etag) => saveCollection.mutateAsync({ etag, values }),
    toValues: toCollectionFormValues,
    toastId: saveCollectionToastId,
  });

  return (
    <LanguageForm
      resource={translationResources.galleryCollection(collection.data.id)}
      fields={languageFields}
    >
      {/* The fields read the form from the context. */}
      <FormProvider {...form}>
        <EditForm className={className} {...editForm}>
          <CollectionFields
            isSaving={editForm.isSaving}
            savedCover={saved.data.cover}
            works={works}
            collectionId={collection.data.id}
          />
        </EditForm>
      </FormProvider>
    </LanguageForm>
  );
}
