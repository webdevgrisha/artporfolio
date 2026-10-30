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

/** Whether files are dragged, not text or a link, which the browser keeps handling itself. */
function hasFiles(event: DragEvent): boolean {
  return event.dataTransfer.types.includes("Files");
}

/** Accepts files dropped onto an element and tells whether files are being dragged over it. */
export function useFileDrop({ disabled, onDrop }: UseFileDropParams) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  function handleDragOver(event: DragEvent) {
    if (!hasFiles(event)) return;

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
    // Text dropped into a field inside the target, such as a description, goes into the field.
    if (!hasFiles(event)) return;

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
