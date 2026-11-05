import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import type { GalleryWorkSummary } from "@/entities/gallery";
import { isPreconditionFailed } from "@/shared/api/httpError";
import { galleryCollectionPath } from "@/shared/config/routes";
import { EditForm } from "@/shared/ui/edit-form";
import { useAllowNextNavigation } from "@/shared/ui/unsaved-changes";

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
  const navigate = useNavigate();
  const allowNextNavigation = useAllowNextNavigation();
  // Every try of this form creates the same collection, so a retry after a lost response never
  // creates a second one.
  const [id] = React.useState(() => crypto.randomUUID());
  const form = useForm<CollectionFormValues>({
    defaultValues: emptyCollectionFormValues,
    resolver: zodResolver(collectionFormSchema),
  });
  const createCollection = useCreateCollection();
  const {
    formState: { isDirty },
    handleSubmit,
    reset,
  } = form;
  const isSaving = createCollection.isPending;

  function openCreated() {
    const path = galleryCollectionPath(id);

    allowNextNavigation(path);
    // Back from the edit page leads to the list, not to an empty form again.
    void navigate(path, { replace: true });
  }

  function create(values: CollectionFormValues) {
    // On failure the mutation shows the error and the values stay for another try; if an earlier
    // try already saved the data, its response was lost, so the saved data opens.
    createCollection.mutate(
      { id, values },
      {
        onError: (error) => {
          if (isPreconditionFailed(error)) openCreated();
        },
        // Called only while this form is open: once the user has left it, perhaps for another new
        // collection, the created one just appears in the list.
        onSuccess: openCreated,
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
        <CollectionFields isSaving={isSaving} savedCover={null} works={works} />
      </EditForm>
    </FormProvider>
  );
}
