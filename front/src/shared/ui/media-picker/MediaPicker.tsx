import clsx from "clsx";
import React, { type ChangeEvent, type DragEvent } from "react";

import { formatFileSize } from "@/shared/lib/formatFileSize";
import { AttachmentIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { PreviewDialog } from "@/shared/ui/preview-dialog";
import { Tooltip } from "@/shared/ui/tooltip";

import { getFileRejection } from "./getFileRejection";
import { MediaImage } from "./MediaImage";
import styles from "./MediaPicker.module.css";
import type { MediaItem } from "./mediaItem";

interface MediaPickerProps {
  /** Accepted MIME types, e.g. `["image/jpeg", "image/png"]`. */
  accept: readonly string[];
  /** The accepted types for people, e.g. `JPEG или PNG`. */
  acceptLabel: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  /** Highlights files that differ from the saved ones. An error takes precedence. */
  isModified?: boolean;
  /** The current files. A single file for now: picking another one is a replacement. */
  items: readonly MediaItem[];
  label: string;
  /** In bytes. */
  maxFileSize: number;
  /** Receives the picked files once they pass the type and size checks. */
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}

/**
 * Picks files with the attachment button or by dropping them onto the frame, and shows each one
 * as a thumbnail that opens it in full. It only reports the choice: the owner keeps the files and
 * uploads them on save.
 */
export function MediaPicker({
  accept,
  acceptLabel,
  className,
  disabled = false,
  error,
  isModified = false,
  items,
  label,
  maxFileSize,
  onAdd,
  onRemove,
}: MediaPickerProps) {
  const id = React.useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selectButtonRef = React.useRef<HTMLButtonElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [viewedItemId, setViewedItemId] = React.useState<string>();
  const viewedItem = items.find((item) => item.id === viewedItemId);
  // A rejected file never reaches the owner, so the picker explains it itself. The message belongs
  // to the files it was given with: once the owner changes them (a pick, a removal, a revert),
  // it is outdated.
  const itemsKey = items.map((item) => item.id).join("\n");
  const [rejection, setRejection] = React.useState<{ itemsKey: string; message: string }>();
  const shownError = (rejection?.itemsKey === itemsKey ? rejection.message : undefined) ?? error;
  const selectLabel = items.length > 0 ? "Заменить файл" : "Выбрать файл";

  function addFiles(fileList: FileList) {
    const files = Array.from(fileList);
    const [file] = files;
    if (!file) return;

    const fileRejection =
      files.length > 1
        ? "Можно выбрать только один файл"
        : getFileRejection(file, { accept, acceptLabel, maxFileSize });

    setRejection(fileRejection ? { itemsKey, message: fileRejection } : undefined);
    if (!fileRejection) onAdd(files);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.currentTarget.files) addFiles(event.currentTarget.files);
    // Lets the same file be picked again, e.g. after it was removed.
    event.currentTarget.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLFieldSetElement>) {
    if (disabled) return;

    // Allows the drop; without it the browser would open the file instead.
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLFieldSetElement>) {
    // Moving over a child element also fires dragleave on the fieldset.
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsDragOver(false);
  }

  function handleDrop(event: DragEvent<HTMLFieldSetElement>) {
    event.preventDefault();
    setIsDragOver(false);
    if (!disabled) addFiles(event.dataTransfer.files);
  }

  function removeItem(itemId: string) {
    onRemove(itemId);
    // The remove button disappears together with the file.
    selectButtonRef.current?.focus();
  }

  return (
    <>
      {/* A disabled fieldset also disables every control inside it. */}
      <fieldset
        className={clsx(styles.root, className)}
        disabled={disabled}
        aria-describedby={[hintId, shownError ? errorId : undefined].filter(Boolean).join(" ")}
        // Dropping is a shortcut for the pointer; the attachment button is the accessible way.
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <legend className={styles.label}>{label}</legend>

        <div
          className={clsx(styles.frame, {
            [styles.frameModified]: isModified,
            [styles.frameInvalid]: Boolean(shownError),
            [styles.frameDragOver]: isDragOver,
            [styles.frameDisabled]: disabled,
          })}
        >
          {items.length > 0 ? (
            <ul className={styles.items}>
              {items.map((item) => {
                const removeLabel = `Удалить ${item.name}`;
                const openLabel = `Открыть ${item.name}`;

                return (
                  <li key={item.id} className={styles.item}>
                    <div className={styles.itemHeader}>
                      <span className={styles.fileName}>
                        {item.name} ({formatFileSize(item.size)})
                      </span>
                      <Tooltip content={removeLabel}>
                        <IconButton label={removeLabel} onClick={() => removeItem(item.id)}>
                          <TrashIcon className={styles.removeIcon} />
                        </IconButton>
                      </Tooltip>
                    </div>
                    <Tooltip className={styles.thumbnailTooltip} content={openLabel}>
                      <IconButton
                        className={styles.thumbnailButton}
                        label={openLabel}
                        onClick={() => setViewedItemId(item.id)}
                      >
                        <MediaImage className={styles.thumbnail} source={item.source} />
                      </IconButton>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.placeholder}>Перетащите файл сюда или выберите его</p>
          )}

          <Tooltip className={styles.selectTooltip} content={selectLabel}>
            <IconButton
              ref={selectButtonRef}
              label={selectLabel}
              onClick={() => inputRef.current?.click()}
            >
              <AttachmentIcon className={styles.selectIcon} />
            </IconButton>
          </Tooltip>

          {/* Opened by the attachment button, which is the accessible control. */}
          <input
            ref={inputRef}
            className={styles.fileInput}
            type="file"
            accept={accept.join(",")}
            tabIndex={-1}
            aria-hidden="true"
            onChange={handleInputChange}
          />
        </div>

        <p className={styles.hint} id={hintId}>
          {acceptLabel}, до {formatFileSize(maxFileSize)}
        </p>
        {/* Announces a rejected file: the focus stays on the attachment button. */}
        <div aria-live="polite">
          {shownError ? (
            <p className={styles.error} id={errorId}>
              {shownError}
            </p>
          ) : null}
        </div>
      </fieldset>

      {/* Outside the fieldset: a file dropped onto the open dialog is not a pick. */}
      <PreviewDialog
        isOpen={Boolean(viewedItem)}
        title={viewedItem?.name ?? ""}
        onClose={() => setViewedItemId(undefined)}
      >
        {viewedItem ? (
          <MediaImage
            className={styles.fullSizeImage}
            source={viewedItem.fullSizeSource ?? viewedItem.source}
          />
        ) : null}
      </PreviewDialog>
    </>
  );
}
