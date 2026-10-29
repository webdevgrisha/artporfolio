import React, { type DragEvent } from "react";

interface UseFileDropParams {
  disabled: boolean;
  onDrop: (files: FileList) => void;
}

/** Accepts files dropped onto an element and tells whether files are being dragged over it. */
export function useFileDrop({ disabled, onDrop }: UseFileDropParams) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  function handleDragOver(event: DragEvent) {
    if (disabled) return;

    // Allows the drop; without it the browser would open the file instead.
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }

  function handleDragLeave(event: DragEvent) {
    // Moving over a child element also fires dragleave on the drop target.
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsDragOver(false);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    if (!disabled) onDrop(event.dataTransfer.files);
  }

  return {
    dropTargetProps: {
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    isDragOver,
  };
}
