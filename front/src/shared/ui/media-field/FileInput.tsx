import type { ChangeEvent, Ref } from "react";

interface FileInputProps {
  accept: readonly string[];
  multiple?: boolean;
  /** Receives the picked files; the dialog was cancelled when it is not called. */
  onPick: (files: FileList) => void;
  /** Opens the file dialog with `click()`. */
  ref: Ref<HTMLInputElement>;
}

/**
 * The file dialog of a picker. It is hidden: a button of the picker opens it and is the
 * accessible control.
 */
export function FileInput({ accept, multiple = false, onPick, ref }: FileInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget;
    if (files && files.length > 0) onPick(files);
    // Lets the same file be picked again, e.g. after it was removed.
    event.currentTarget.value = "";
  }

  return (
    <input
      ref={ref}
      type="file"
      accept={accept.join(",")}
      multiple={multiple}
      hidden
      onChange={handleChange}
    />
  );
}
