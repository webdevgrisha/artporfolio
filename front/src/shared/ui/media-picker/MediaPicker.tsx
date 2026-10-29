import React from "react";

import { formatFileSize } from "@/shared/lib/formatFileSize";
import { type FileRules, getFileRejection } from "@/shared/lib/getFileRejection";
import { useFileDrop } from "@/shared/lib/useFileDrop";
import { AttachmentIcon, TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { FileInput, MediaFieldset } from "@/shared/ui/media-field";
import {
  MediaFileName,
  type MediaItem,
  MediaPreviewDialog,
  MediaThumbnailButton,
} from "@/shared/ui/media-preview";
import { Tooltip } from "@/shared/ui/tooltip";

import styles from "./MediaPicker.module.css";

interface MediaPickerProps {
  className?: string;
  disabled?: boolean;
  error?: string;
  /** Highlights files that differ from the saved ones. An error takes precedence. */
  isModified?: boolean;
  /** The current files. A single file for now: picking another one is a replacement. */
  items: readonly MediaItem[];
  label: string;
  /** Receives the picked files once they pass the type and size checks. */
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  rules: FileRules;
}

/**
 * Picks files with the attachment button or by dropping them onto the frame, and shows each one
 * as a thumbnail that opens it in full. It only reports the choice: the owner keeps the files and
 * uploads them on save.
 */
export function MediaPicker({
  className,
  disabled = false,
  error,
  isModified = false,
  items,
  label,
  onAdd,
  onRemove,
  rules,
}: MediaPickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selectButtonRef = React.useRef<HTMLButtonElement>(null);
  const [viewedItemId, setViewedItemId] = React.useState<string>();
  // A rejected file never reaches the owner, so the picker explains it itself. The message belongs
  // to the files it was given with: once the owner changes them (a pick, a removal, a revert),
  // it is outdated.
  const itemsKey = items.map((item) => item.id).join("\n");
  const [rejection, setRejection] = React.useState<{ itemsKey: string; message: string }>();
  const shownError = (rejection?.itemsKey === itemsKey ? rejection.message : undefined) ?? error;
  const selectLabel = items.length > 0 ? "Заменить файл" : "Выбрать файл";
  const { dropTargetProps, isDragOver } = useFileDrop({ disabled, onDrop: addFiles });

  function addFiles(fileList: FileList) {
    const files = Array.from(fileList);
    const [file] = files;
    if (!file) return;

    const fileRejection =
      files.length > 1 ? "Можно выбрать только один файл" : getFileRejection(file, rules);

    setRejection(fileRejection ? { itemsKey, message: fileRejection } : undefined);
    if (!fileRejection) onAdd(files);
  }

  function removeItem(itemId: string) {
    onRemove(itemId);
    // The remove button disappears together with the file.
    selectButtonRef.current?.focus();
  }

  return (
    <>
      <MediaFieldset
        className={className}
        frameClassName={styles.frame}
        label={label}
        hint={`${rules.acceptLabel}, до ${formatFileSize(rules.maxFileSize)}`}
        error={shownError}
        disabled={disabled}
        isModified={isModified}
        isDragOver={isDragOver}
        dropTargetProps={dropTargetProps}
      >
        {items.length > 0 ? (
          <ul className={styles.items}>
            {items.map((item) => {
              const removeLabel = `Удалить ${item.name}`;

              return (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <MediaFileName item={item} />
                    <Tooltip className={styles.removeTooltip} content={removeLabel}>
                      <IconButton label={removeLabel} onClick={() => removeItem(item.id)}>
                        <TrashIcon className={styles.removeIcon} />
                      </IconButton>
                    </Tooltip>
                  </div>
                  <MediaThumbnailButton
                    className={styles.thumbnail}
                    item={item}
                    onOpen={() => setViewedItemId(item.id)}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.placeholder}>Перетащите файл сюда или нажмите на скрепку</p>
        )}

        {/* The only control that picks a file: a click elsewhere in the frame does nothing. */}
        <Tooltip className={styles.selectTooltip} content={selectLabel}>
          <IconButton
            ref={selectButtonRef}
            label={selectLabel}
            onClick={() => inputRef.current?.click()}
          >
            <AttachmentIcon className={styles.selectIcon} />
          </IconButton>
        </Tooltip>
        <FileInput ref={inputRef} accept={rules.accept} onPick={addFiles} />
      </MediaFieldset>

      {/* Outside the fieldset: a file dropped onto the open dialog is not a pick. */}
      <MediaPreviewDialog
        item={items.find((item) => item.id === viewedItemId)}
        onClose={() => setViewedItemId(undefined)}
      />
    </>
  );
}
