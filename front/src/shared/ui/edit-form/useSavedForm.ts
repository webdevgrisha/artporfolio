import React from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import type { Tagged } from "@/shared/api/http";
import { savedMessage, showSuccessToast } from "@/shared/ui/toast";

import type { EditFormProps } from "./EditForm";

interface UseSavedFormParams<TData, TValues extends FieldValues> {
  /** The form; its default values are `toValues(initial.data)`. */
  form: UseFormReturn<TValues>;
  /** The resource as stored on the server when the form opens, with its ETag. */
  initial: Tagged<TData>;
  /**
   * Sends the changes made from the resource with the ETag `etag` and shows the result; resolves
   * with the saved resource and its new ETag.
   */
  save: (values: TValues, etag: string) => Promise<Tagged<TData>>;
  toValues: (data: TData) => TValues;
  /** The toast of `save`, for the result of a save with nothing to send. */
  toastId: string;
}

/**
 * Edits a resource that is saved as a whole. The form keeps the resource its values were made
 * from, with its ETag: a save sends that ETag, so changes made since, for example in another tab,
 * are never overwritten, and a reload of the cache never moves the base of the open form. Only a
 * save replaces the base and the values together; after a conflict `save` asks to reload the page.
 */
export function useSavedForm<TData, TValues extends FieldValues>({
  form,
  initial,
  save,
  toValues,
  toastId,
}: UseSavedFormParams<TData, TValues>) {
  const [saved, setSaved] = React.useState(initial);
  const {
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
  } = form;

  async function saveChanges(values: TValues) {
    if (!isDirty) {
      showSuccessToast(savedMessage, { id: toastId });
      return;
    }

    let next: Tagged<TData>;

    try {
      next = await save(values, saved.etag);
    } catch {
      // `save` has shown the error, and the changes stay.
      return;
    }

    setSaved(next);
    reset(toValues(next.data));
  }

  const editForm: Omit<EditFormProps, "children" | "className"> = {
    hasUnsavedChanges: isDirty,
    isSaving: isSubmitting,
    onRevert: () => reset(),
    onSubmit: handleSubmit(saveChanges),
  };

  return { editForm, saved };
}
