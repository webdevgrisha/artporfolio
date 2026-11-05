import React, { type ReactNode } from "react";

import { formatFileSize } from "@/shared/lib/formatFileSize";
import { type FileRules, getFileRejection } from "@/shared/lib/getFileRejection";
import { joinMessages } from "@/shared/lib/joinMessages";
import { useConfirmation } from "@/shared/lib/useConfirmation";
import { useFileDrop } from "@/shared/lib/useFileDrop";
import { Button } from "@/shared/ui/button";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-dialog";
import { FileInput, MediaFieldset } from "@/shared/ui/media-field";
import { MediaPreviewDialog } from "@/shared/ui/media-preview";
import { formatPosition, SortableList, useSortableRowFocus } from "@/shared/ui/sortable";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";
import { photoSortableMessages } from "./photoSortableMessages";
import styles from "./SortableMediaList.module.css";
import { type RowControl, SortableMediaRow } from "./SortableMediaRow";
import type { SortableMediaItem } from "./sortableMediaItem";

interface SortableMediaListProps {
  className?: string;
  disabled?: boolean;
  /** The error of the field, including the rejection reported with `onRejectionChange`. */
  error?: string;
  /** Highlights the list when items were added, removed or moved. An error takes precedence. */
  isModified?: boolean;
  /** The current items, in order. */
  items: readonly SortableMediaItem[];
  label: string;
  maxItems: number;
  /** Receives the picked files that pass the checks and fit under `maxItems`. */
  onAdd: (files: File[]) => void;
  /** Moves the item at index `from` to index `to`. */
  onMove: (from: number, to: number) => void;
  /**
   * Receives why files were refused, or `undefined` once the next change made in the list makes
   * the message outdated. The owner shows it in `error` until the form is saved or reverted.
   */
  onRejectionChange: (message: string | undefined) => void;
  onRemove: (id: string) => void;
  onReplace: (id: string, file: File) => void;
  /** The fields of an item, such as its description, shown under its file. */
  renderItemFields?: (item: SortableMediaItem, index: number) => ReactNode;
  rules: FileRules;
}

/**
 * An ordered list of files: adds them with the button or by dropping them onto the list, and
 * moves them by dragging the handle or with the arrow buttons, which also work without a
 * pointer (WCAG 2.5.7). Each item opens in full and can be replaced or removed. It only reports
 * the changes and the refusals: the owner keeps the files and uploads them on save.
 */
export function SortableMediaList({
  className,
  disabled = false,
  error,
  isModified = false,
  items,
  label,
  maxItems,
  onAdd,
  onMove,
  onRejectionChange,
  onRemove,
  onReplace,
  renderItemFields,
  rules,
}: SortableMediaListProps) {
  const addInputRef = React.useRef<HTMLInputElement>(null);
  const replaceInputRef = React.useRef<HTMLInputElement>(null);
  const replacedItemIdRef = React.useRef<string>(undefined);
  const addButtonRef = React.useRef<HTMLButtonElement>(null);
  const { focusAfterUpdate, listRef } = useSortableRowFocus<HTMLUListElement>();
  const [viewedItemId, setViewedItemId] = React.useState<string>();
  // Announces a move made with the arrow buttons; dnd-kit announces the dragged ones.
  const [moveAnnouncement, setMoveAnnouncement] = React.useState("");
  // A saved item asks first.
  const removal = useConfirmation<string>((itemId) => removeItem(getItemIndex(itemId)));
  const removedItem = items.find((item) => item.id === removal.pending);
  const isFull = items.length >= maxItems;
  const { dropTargetProps, isDragOver } = useFileDrop({
    disabled: disabled || isFull,
    onDrop: addFiles,
  });

  function getItemIndex(itemId: string): number {
    return items.findIndex((item) => item.id === itemId);
  }

  function getItemName(itemId: string): string {
    return items[getItemIndex(itemId)]?.name ?? "";
  }

  function addFiles(fileList: FileList) {
    const rejections = new Set<string>();
    const accepted: File[] = [];

    for (const file of Array.from(fileList)) {
      const fileRejection = getFileRejection(file, rules);
      if (fileRejection) {
        rejections.add(fileRejection);
      } else {
        accepted.push(file);
      }
    }

    const room = maxItems - items.length;
    if (accepted.length > room) {
      rejections.add(`Можно добавить не больше ${String(maxItems)} фото`);
      accepted.splice(room);
    }

    onRejectionChange(joinMessages(rejections));
    if (accepted.length > 0) onAdd(accepted);
  }

  function replaceFile(fileList: FileList) {
    const [file] = Array.from(fileList);
    const itemId = replacedItemIdRef.current;
    if (!file || !itemId) return;

    const fileRejection = getFileRejection(file, rules);
    onRejectionChange(fileRejection);
    if (!fileRejection) onReplace(itemId, file);
  }

  function openReplacePicker(itemId: string) {
    replacedItemIdRef.current = itemId;
    replaceInputRef.current?.click();
  }

  function moveItem(from: number, to: number, control?: RowControl) {
    const item = items[from];
    if (!item) return;

    onRejectionChange(undefined);
    if (control) {
      focusAfterUpdate({ control, itemId: item.id });
      setMoveAnnouncement(photoSortableMessages.moved(item.name, formatPosition(to, items.length)));
    }
    onMove(from, to);
  }

  function removeItem(index: number) {
    const item = items[index];
    if (!item) return;

    // The focus goes to the next item, or the previous one at the end of the list.
    const nextItem = items[index + 1] ?? items[index - 1];
    focusAfterUpdate(
      nextItem
        ? { control: "remove" satisfies RowControl, itemId: nextItem.id }
        : { element: addButtonRef.current },
    );
    onRejectionChange(undefined);
    onRemove(item.id);
  }

  return (
    <>
      <MediaFieldset
        className={className}
        frameClassName={styles.frame}
        label={label}
        hint={`${rules.acceptLabel}, до ${formatFileSize(rules.maxFileSize)}. Фото: ${String(items.length)} из ${String(maxItems)}`}
        error={error}
        disabled={disabled}
        isModified={isModified}
        isDragOver={isDragOver}
        dropTargetProps={dropTargetProps}
      >
        {items.length > 0 ? (
          <SortableList
            ids={items.map((item) => item.id)}
            messages={photoSortableMessages}
            getName={getItemName}
            onMove={moveItem}
          >
            <ul ref={listRef} className={styles.rows}>
              {items.map((item, index) => (
                <SortableMediaRow
                  key={item.id}
                  item={item}
                  disabled={disabled}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                  onMoveUp={() => moveItem(index, index - 1, "moveUp")}
                  onMoveDown={() => moveItem(index, index + 1, "moveDown")}
                  onOpen={() => setViewedItemId(item.id)}
                  onRemove={() => (item.isSaved ? removal.ask(item.id) : removeItem(index))}
                  onReplace={() => openReplacePicker(item.id)}
                >
                  {renderItemFields?.(item, index)}
                </SortableMediaRow>
              ))}
            </ul>
          </SortableList>
        ) : (
          <p className={styles.placeholder}>Перетащите фото сюда или нажмите «Добавить фото»</p>
        )}

        <Button
          ref={addButtonRef}
          className={styles.addButton}
          disabled={isFull}
          onClick={() => addInputRef.current?.click()}
        >
          Добавить фото
        </Button>
        <FileInput ref={addInputRef} accept={rules.accept} multiple onPick={addFiles} />
        <FileInput ref={replaceInputRef} accept={rules.accept} onPick={replaceFile} />
      </MediaFieldset>

      <div aria-live="polite">
        <VisuallyHidden>{moveAnnouncement}</VisuallyHidden>
      </div>

      {/* Outside the fieldset: a file dropped onto the open dialogs is not a pick. */}
      <ConfirmDeleteDialog
        isOpen={removal.pending !== undefined}
        title={`Удалить фото «${removedItem?.name ?? ""}»?`}
        description="После сохранения фото пропадёт с сайта. Это нельзя отменить."
        onCancel={removal.cancel}
        onConfirm={removal.confirm}
      />
      <MediaPreviewDialog
        item={items.find((item) => item.id === viewedItemId)}
        onClose={() => setViewedItemId(undefined)}
      />
    </>
  );
}
