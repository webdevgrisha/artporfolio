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
  /** Highlights a file that differs from the saved one. An error takes precedence. */
  isModified?: boolean;
  /** The current file; picking another one replaces it. */
  item: MediaItem | undefined;
  label: string;
  /** Receives the picked file once it passes the type and size checks. */
  onPick: (file: File) => void;
  onRemove: () => void;
  rules: FileRules;
}

/**
 * Picks one file with the attachment button or by dropping it onto the frame, and shows it as a
 * thumbnail that opens it in full. It only reports the choice: the owner keeps the file and
 * uploads it on save.
 */
export function MediaPicker({
  className,
  disabled = false,
  error,
  isModified = false,
  item,
  label,
  onPick,
  onRemove,
  rules,
}: MediaPickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selectButtonRef = React.useRef<HTMLButtonElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  // A rejected file never reaches the owner, so the picker explains it itself. The message belongs
  // to the file it was given with: once the owner changes it (a pick, a removal, a revert), it is
  // outdated.
  const [rejection, setRejection] = React.useState<{ itemId?: string; message: string }>();
  const shownError = (rejection?.itemId === item?.id ? rejection?.message : undefined) ?? error;
  const selectLabel = item ? "Заменить файл" : "Выбрать файл";
  const { dropTargetProps, isDragOver } = useFileDrop({ disabled, onDrop: pickFile });

  function pickFile(fileList: FileList) {
    const [file] = Array.from(fileList);
    if (!file) return;

    const fileRejection =
      fileList.length > 1 ? "Можно выбрать только один файл" : getFileRejection(file, rules);

    setRejection(fileRejection ? { itemId: item?.id, message: fileRejection } : undefined);
    if (!fileRejection) onPick(file);
  }

  function removeItem() {
    onRemove();
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
        {item ? (
          <div className={styles.item}>
            <div className={styles.itemHeader}>
              <MediaFileName item={item} />
              <Tooltip className={styles.removeTooltip} content={`Удалить ${item.name}`}>
                <IconButton label={`Удалить ${item.name}`} onClick={removeItem}>
                  <TrashIcon className={styles.removeIcon} />
                </IconButton>
              </Tooltip>
            </div>
            <MediaThumbnailButton
              className={styles.thumbnail}
              item={item}
              onOpen={() => setIsPreviewOpen(true)}
            />
          </div>
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
        <FileInput ref={inputRef} accept={rules.accept} onPick={pickFile} />
      </MediaFieldset>

      {/* Outside the fieldset: a file dropped onto the open dialog is not a pick. */}
      <MediaPreviewDialog
        item={isPreviewOpen ? item : undefined}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}
