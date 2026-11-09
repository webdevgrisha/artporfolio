import React from "react";

/** What a row needs to open and close its editing. */
export interface RowEditing {
  isEditing: boolean;
  /** Brings back what the editing started from: Escape anywhere in the row. */
  onCancel: () => void;
  /** Keeps the changes: the focus has left the row, or Enter was pressed in the title. */
  onFinish: () => void;
  onStart: () => void;
}

interface UseRowEditingParams<TStart> {
  /** Puts back what the editing of the row started from. */
  restore: (index: number, start: TStart) => void;
  /** Checks the row once its editing ends. */
  validate: (index: number) => void;
}

/** The one row of a list being edited, and what it holds when the editing starts. */
export function useRowEditing<TStart>({ restore, validate }: UseRowEditingParams<TStart>) {
  const [editing, setEditing] = React.useState<{ key: string; start: TStart }>();

  function stopEditing() {
    setEditing(undefined);
  }

  /** The row `key` at `index`; a row with an error stays open until it is fixed. */
  function rowEditing(key: string, index: number, start: TStart, hasError: boolean): RowEditing {
    return {
      isEditing: editing?.key === key || hasError,
      onCancel: () => {
        // A row open for its error alone has no start of its own: the start kept is another row's.
        if (editing?.key === key) restore(index, editing.start);
        stopEditing();
      },
      onFinish: () => {
        stopEditing();
        validate(index);
      },
      onStart: () => setEditing({ key, start }),
    };
  }

  return { rowEditing, stopEditing };
}
