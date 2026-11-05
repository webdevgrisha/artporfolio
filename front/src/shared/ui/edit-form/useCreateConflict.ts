import React from "react";

import { HttpError } from "@/shared/api/httpError";

import type { EditFormConflict } from "./EditForm";

/**
 * The question of a form that creates data at an id it picked once the server refuses the id with
 * 412: an earlier try created the data although its response was lost, and the data may have been
 * changed since, for example in another tab. The form never overwrites it; it offers to open what
 * is saved, where the changes can be made again.
 */
export function useCreateConflict(openSaved: () => void) {
  const [isOpen, setIsOpen] = React.useState(false);

  const conflict: EditFormConflict = {
    isOpen,
    onKeep: () => setIsOpen(false),
    onTakeLatest: () => {
      setIsOpen(false);
      openSaved();
    },
    reason: "exists",
  };

  /** Asks the question when the create failed because the data already exists. */
  function onCreateError(error: unknown) {
    if (error instanceof HttpError && error.status === 412) setIsOpen(true);
  }

  return { conflict, onCreateError };
}
