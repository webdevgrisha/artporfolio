import type { UseMutationResult } from "@tanstack/react-query";
import React from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useNavigate } from "react-router";

import { isPreconditionFailed } from "@/shared/api/httpError";
import { useAllowNextNavigation } from "@/shared/ui/unsaved-changes";

import type { EditFormProps } from "./EditForm";

/** What a form sends to create a resource. */
interface CreateParams<TValues> {
  /** A new UUID: every try of the form sends the same one. */
  id: string;
  values: TValues;
}

interface UseCreateFormParams<TData, TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  /** Creates the resource and shows the result. */
  mutation: UseMutationResult<TData, Error, CreateParams<TValues>>;
  /** The page that opens in place of the form, from the id of the new resource. */
  toPath: (id: string) => string;
}

/**
 * Creates a resource under an id the form picks once, so a retry after a lost response never
 * creates a second one: the server refuses it with 412, and the page of what is saved opens.
 */
export function useCreateForm<TData, TValues extends FieldValues>({
  form,
  mutation,
  toPath,
}: UseCreateFormParams<TData, TValues>): Omit<EditFormProps, "children" | "className"> {
  const navigate = useNavigate();
  const allowNextNavigation = useAllowNextNavigation();
  const [id] = React.useState(() => crypto.randomUUID());
  const {
    formState: { isDirty },
    handleSubmit,
    reset,
  } = form;

  function openCreated() {
    const path = toPath(id);

    allowNextNavigation(path);
    // Back from there does not lead to an empty form again.
    void navigate(path, { replace: true });
  }

  function create(values: TValues) {
    // On failure the mutation shows the error and the values stay for another try.
    mutation.mutate(
      { id, values },
      {
        onError: (error) => {
          if (isPreconditionFailed(error)) openCreated();
        },
        // Called only while this form is open: once the user has left it, perhaps for another new
        // one, the created one just appears in its list.
        onSuccess: openCreated,
      },
    );
  }

  return {
    hasUnsavedChanges: isDirty,
    isSaving: mutation.isPending,
    onRevert: () => reset(),
    onSubmit: handleSubmit(create),
  };
}
