import { type FetchQueryOptions, type QueryKey, useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import type { Tagged } from "@/shared/api/http";
import { HttpError } from "@/shared/api/httpError";
import { savedMessage, showSuccessToast } from "@/shared/ui/toast";

import type { EditFormProps } from "./EditForm";

interface UseSavedFormParams<TData, TValues extends FieldValues, TQueryKey extends QueryKey> {
  /** The form; its default values are `toValues(initial.data)`. */
  form: UseFormReturn<TValues>;
  /** The resource as stored on the server when the form opens, with its ETag. */
  initial: Tagged<TData>;
  /** Reads the resource afresh when a save finds that it has changed since. */
  query: FetchQueryOptions<Tagged<TData>, Error, Tagged<TData>, TQueryKey>;
  /**
   * Sends the changes made from the resource with the ETag `etag` and shows the result; resolves
   * with the saved resource and its new ETag. `null` when the changes need no request.
   */
  save: (values: TValues, etag: string) => Promise<Tagged<TData>> | null;
  toValues: (data: TData) => TValues;
  /** The toast of `save`, for the result of a save with nothing to send. */
  toastId: string;
}

/** The server refused the save: the resource has changed since the form read it. */
function isConflict(error: unknown): boolean {
  return error instanceof HttpError && error.status === 412;
}

/**
 * Edits a resource that is saved as a whole. The form keeps the resource its values were made
 * from, with its ETag: a save sends that ETag, so changes made since, for example in another tab,
 * are never overwritten, and a reload of the cache never moves the base of the open form. Only a
 * save, or taking the latest version after a conflict, replaces the base and the values together.
 */
export function useSavedForm<TData, TValues extends FieldValues, TQueryKey extends QueryKey>({
  form,
  initial,
  query,
  save,
  toValues,
  toastId,
}: UseSavedFormParams<TData, TValues, TQueryKey>) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = React.useState(initial);
  // The version on the server after a conflict; the user decides whether to take it.
  const [latest, setLatest] = React.useState<Tagged<TData>>();
  const {
    formState: { isDirty, isSubmitting },
    handleSubmit,
    reset,
  } = form;

  function startFrom(resource: Tagged<TData>) {
    setSaved(resource);
    reset(toValues(resource.data));
  }

  async function loadLatest() {
    try {
      setLatest(await queryClient.fetchQuery({ ...query, staleTime: 0 }));
    } catch {
      // The toast of the save already says that it failed; the next conflict tries again.
    }
  }

  async function saveChanges(values: TValues) {
    const saving = isDirty ? save(values, saved.etag) : null;

    if (!saving) {
      showSuccessToast(savedMessage, { id: toastId });
      return;
    }

    let next: Tagged<TData>;

    try {
      next = await saving;
    } catch (error) {
      // `save` has shown the error and the changes stay. After a conflict the same save would
      // fail again, so the latest version is offered instead.
      if (isConflict(error)) await loadLatest();
      return;
    }

    startFrom(next);
  }

  const editForm: Omit<EditFormProps, "children" | "className"> = {
    conflict: {
      isOpen: latest !== undefined,
      onKeep: () => setLatest(undefined),
      onTakeLatest: () => {
        if (latest) startFrom(latest);
        setLatest(undefined);
      },
    },
    hasUnsavedChanges: isDirty,
    isSaving: isSubmitting,
    onRevert: () => reset(),
    onSubmit: handleSubmit(saveChanges),
  };

  return { editForm, saved };
}
