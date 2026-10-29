import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  type Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import React, { type ReactNode } from "react";

import { formatFileSize } from "@/shared/lib/formatFileSize";
import { type FileRules, getFileRejection } from "@/shared/lib/getFileRejection";
import { useFileDrop } from "@/shared/lib/useFileDrop";
import { Button } from "@/shared/ui/button";
import { FileInput, MediaFieldset } from "@/shared/ui/media-field";
import { type MediaItem, MediaPreviewDialog } from "@/shared/ui/media-preview";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import styles from "./SortableMediaList.module.css";
import { type RowControl, SortableMediaRow } from "./SortableMediaRow";
import {
  formatPosition,
  getAnnouncements,
  screenReaderInstructions,
} from "./sortableAnnouncements";

export interface SortableMediaItem extends MediaItem {
  /** Highlights an item that differs from the saved one. */
  isModified?: boolean;
}

interface SortableMediaListProps {
  className?: string;
  disabled?: boolean;
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
  onRemove: (id: string) => void;
  onReplace: (id: string, file: File) => void;
  /** The fields of an item, such as its description, shown under its file. */
  renderItemFields?: (item: SortableMediaItem, index: number) => ReactNode;
  rules: FileRules;
}

/** Where the focus goes once the items are updated: a control of a row, or the add button. */
type PendingFocus = { control: RowControl; itemId: string } | "add";

// Rows only move up and down.
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/**
 * An ordered list of files: adds them with the button or by dropping them onto the list, and
 * moves them by dragging the handle or with the arrow buttons, which also work without a
 * pointer (WCAG 2.5.7). Each item opens in full and can be replaced or removed. It only reports
 * the changes: the owner keeps the files and uploads them on save.
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
  onRemove,
  onReplace,
  renderItemFields,
  rules,
}: SortableMediaListProps) {
  const listRef = React.useRef<HTMLUListElement>(null);
  const addInputRef = React.useRef<HTMLInputElement>(null);
  const replaceInputRef = React.useRef<HTMLInputElement>(null);
  const addButtonRef = React.useRef<HTMLButtonElement>(null);
  const replacedItemIdRef = React.useRef<string>(undefined);
  const pendingFocusRef = React.useRef<PendingFocus>(undefined);
  const [viewedItemId, setViewedItemId] = React.useState<string>();
  // A rejected file never reaches the owner, so the list explains it itself, until the next
  // change made in the list.
  const [rejection, setRejection] = React.useState<string>();
  // Announces a move made with the arrow buttons; dnd-kit announces the dragged ones.
  const [moveAnnouncement, setMoveAnnouncement] = React.useState("");
  const shownError = rejection ?? error;
  const isFull = items.length >= maxItems;
  const { dropTargetProps, isDragOver } = useFileDrop({
    disabled: disabled || isFull,
    onDrop: addFiles,
  });
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // The focused button can move or disappear with its item, so it is restored once the owner has
  // updated the items. It runs after every render: the owner's update is the next one.
  React.useLayoutEffect(() => {
    const pendingFocus = pendingFocusRef.current;
    if (!pendingFocus) return;

    pendingFocusRef.current = undefined;
    if (pendingFocus === "add") {
      addButtonRef.current?.focus();
      return;
    }

    const row = listRef.current?.querySelector(
      `[data-item-id="${CSS.escape(pendingFocus.itemId)}"]`,
    );
    const button = row?.querySelector<HTMLButtonElement>(
      `[data-control="${pendingFocus.control}"]:not(:disabled)`,
    );
    // An arrow is disabled at the end of the list: the other one takes the focus.
    const fallback = row?.querySelector<HTMLButtonElement>('[data-control^="move"]:not(:disabled)');
    (button ?? fallback)?.focus();
  });

  function getItemIndex(itemId: string): number {
    return items.findIndex((item) => item.id === itemId);
  }

  function getItemName(itemId: string): string {
    return items[getItemIndex(itemId)]?.name ?? "";
  }

  function addFiles(fileList: FileList) {
    const files = Array.from(fileList);

    const rejections = new Set<string>();
    const accepted: File[] = [];

    for (const file of files) {
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

    setRejection(rejections.size > 0 ? [...rejections].join(". ") : undefined);
    if (accepted.length > 0) onAdd(accepted);
  }

  function replaceFile(fileList: FileList) {
    const [file] = Array.from(fileList);
    const itemId = replacedItemIdRef.current;
    if (!file || !itemId) return;

    const fileRejection = getFileRejection(file, rules);
    setRejection(fileRejection);
    if (!fileRejection) onReplace(itemId, file);
  }

  function openReplacePicker(itemId: string) {
    replacedItemIdRef.current = itemId;
    replaceInputRef.current?.click();
  }

  function moveItem(from: number, to: number, control?: RowControl) {
    const item = items[from];
    if (!item || to < 0 || to >= items.length) return;

    setRejection(undefined);
    if (control) {
      pendingFocusRef.current = { control, itemId: item.id };
      setMoveAnnouncement(
        `Фото «${item.name}» перемещено на место ${formatPosition(to, items.length)}`,
      );
    }
    onMove(from, to);
  }

  function removeItem(index: number) {
    const item = items[index];
    if (!item) return;

    // The focus goes to the next item, or the previous one at the end of the list.
    const nextItem = items[index + 1] ?? items[index - 1];
    pendingFocusRef.current = nextItem ? { control: "remove", itemId: nextItem.id } : "add";
    setRejection(undefined);
    onRemove(item.id);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    moveItem(getItemIndex(String(active.id)), getItemIndex(String(over.id)));
  }

  return (
    <>
      <MediaFieldset
        className={className}
        frameClassName={styles.frame}
        label={label}
        hint={`${rules.acceptLabel}, до ${formatFileSize(rules.maxFileSize)}. Фото: ${String(items.length)} из ${String(maxItems)}`}
        error={shownError}
        disabled={disabled}
        isModified={isModified}
        isDragOver={isDragOver}
        dropTargetProps={dropTargetProps}
      >
        {items.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            accessibility={{
              announcements: getAnnouncements(getItemName, (itemId) =>
                formatPosition(getItemIndex(itemId), items.length),
              ),
              screenReaderInstructions,
            }}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
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
                    onRemove={() => removeItem(index)}
                    onReplace={() => openReplacePicker(item.id)}
                  >
                    {renderItemFields?.(item, index)}
                  </SortableMediaRow>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
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

      {/* Outside the fieldset: a file dropped onto the open dialog is not a pick. */}
      <MediaPreviewDialog
        item={items.find((item) => item.id === viewedItemId)}
        onClose={() => setViewedItemId(undefined)}
      />
    </>
  );
}
