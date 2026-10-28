import clsx from "clsx";
import React, { type ChangeEvent } from "react";

import { formatFileSize } from "@/shared/lib/formatFileSize";
import { FieldHint } from "@/shared/ui/field";
import { AttachmentIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Tooltip } from "@/shared/ui/tooltip";

import { getFileRejection } from "./getFileRejection";
import { MediaImage } from "./MediaImage";
import styles from "./MediaPicker.module.css";
import { MediaPreviewDialog } from "./MediaPreviewDialog";
import type { MediaItem } from "./mediaItem";
import { useFileDrop } from "./useFileDrop";

interface MediaPickerProps {
  /**
   * Accepted MIME types and, for files whose type the browser does not know, extensions, as in
   * the `accept` attribute: `["image/jpeg", ".jpg"]`.
   */
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
  const [viewedItemId, setViewedItemId] = React.useState<string>();
  // A rejected file never reaches the owner, so the picker explains it itself. The message belongs
  // to the files it was given with: once the owner changes them (a pick, a removal, a revert),
  // it is outdated.
  const itemsKey = items.map((item) => item.id).join("\n");
  const [rejection, setRejection] = React.useState<{ itemsKey: string; message: string }>();
  const shownError = (rejection?.itemsKey === itemsKey ? rejection.message : undefined) ?? error;
  const hasItems = items.length > 0;
  const selectLabel = hasItems ? "Заменить файл" : "Выбрать файл";
  const { dropTargetProps, isDragOver } = useFileDrop({ disabled, onDrop: addFiles });

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

  function openFilePicker() {
    inputRef.current?.click();
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
        {...dropTargetProps}
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
          {hasItems ? (
            <ul className={styles.items}>
              {items.map((item) => {
                const removeLabel = `Удалить ${item.name}`;
                const openLabel = `Открыть ${item.name}`;

                return (
                  <li key={item.id} className={styles.item}>
                    <div className={styles.itemHeader}>
                      <span className={styles.fileName}>
                        {item.name}{" "}
                        <span className={styles.fileSize}>({formatFileSize(item.size)})</span>
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
            <p className={styles.placeholder}>Перетащите файл сюда или нажмите на скрепку</p>
          )}

          {/* The only control that picks a file: a click elsewhere in the frame does nothing. */}
          <Tooltip className={styles.selectTooltip} content={selectLabel}>
            <IconButton ref={selectButtonRef} label={selectLabel} onClick={openFilePicker}>
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

        <FieldHint id={hintId}>
          {acceptLabel}, до {formatFileSize(maxFileSize)}
        </FieldHint>
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
      <MediaPreviewDialog
        item={items.find((item) => item.id === viewedItemId)}
        onClose={() => setViewedItemId(undefined)}
      />
    </>
  );
}
