import React, { type DragEvent, type DragEventHandler } from "react";

/** The handlers to spread onto the element that files are dropped onto. */
export interface DropTargetProps {
  onDragLeave: DragEventHandler;
  onDragOver: DragEventHandler;
  onDrop: DragEventHandler;
}

interface UseFileDropParams {
  disabled: boolean;
  onDrop: (files: FileList) => void;
}

/** Accepts files dropped onto an element and tells whether files are being dragged over it. */
export function useFileDrop({ disabled, onDrop }: UseFileDropParams) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  function handleDragOver(event: DragEvent) {
    // Takes the drag over from the browser, which would otherwise open the file and leave the
    // page; a disabled target refuses the drop instead.
    event.preventDefault();
    if (disabled) {
      event.dataTransfer.dropEffect = "none";
      return;
    }

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

  const dropTargetProps: DropTargetProps = {
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };

  return { dropTargetProps, isDragOver };
}
