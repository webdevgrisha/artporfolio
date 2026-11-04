import clsx from "clsx";
import React from "react";

import type { GalleryCollection, GalleryWork } from "@/entities/gallery";
import { Button } from "@/shared/ui/button";
import { FieldError, FieldHint, useFieldIds } from "@/shared/ui/field";
import { TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { imageToMediaItem, MediaImage } from "@/shared/ui/media-preview";
import { Tooltip } from "@/shared/ui/tooltip";

import { formatWorkDate } from "../model/workFormSchema";
import { AddWorksDialog } from "./AddWorksDialog";
import styles from "./CollectionWorksField.module.css";

interface CollectionWorksFieldProps {
  /** The collection being edited; none for a new one. */
  collectionId?: string;
  /** The collections of the gallery, to name the one a work to add is in now. */
  collections: readonly GalleryCollection[];
  disabled: boolean;
  error?: string;
  /** Whether the works differ from the saved ones. */
  isModified: boolean;
  /** Gets the ids of the works after a work is added or taken out. */
  onChange: (ids: string[]) => void;
  /** The works of the collection, by id. */
  value: readonly string[];
  /** Every work of the gallery, in the order the site shows them. */
  works: readonly GalleryWork[];
}

/**
 * The works of a collection, in a frame, in the order the site shows them: the latest first. Works
 * are added from a dialog under the frame; a work is taken out by the trash button and stays in the
 * gallery, on its own.
 */
export function CollectionWorksField({
  collectionId,
  collections,
  disabled,
  error,
  isModified,
  onChange,
  value,
  works,
}: CollectionWorksFieldProps) {
  const hint = "На сайте идут по дате, сначала новые";
  const { describedBy, errorId, hintId } = useFieldIds({ error, hint });
  const chosen = works.filter((work) => value.includes(work.id));
  const others = works.filter((work) => !value.includes(work.id));
  const [isAdding, setIsAdding] = React.useState(false);
  const removeButtons = React.useRef(new Map<string, HTMLButtonElement>());
  const addButton = React.useRef<HTMLButtonElement>(null);
  // What takes the focus once a removed row is gone: the button of the next row, or the adding
  // when no row is left, so the focus stays in the field instead of falling to the page.
  const [focusTarget, setFocusTarget] = React.useState<{ workId?: string }>();

  React.useEffect(() => {
    if (focusTarget === undefined) return;

    const { workId } = focusTarget;

    (workId === undefined ? addButton.current : removeButtons.current.get(workId))?.focus();
    setFocusTarget(undefined);
  }, [focusTarget]);

  function remove(id: string) {
    const index = chosen.findIndex((work) => work.id === id);
    const neighbour = chosen[index + 1] ?? chosen[index - 1];

    onChange(value.filter((chosenId) => chosenId !== id));
    setFocusTarget({ workId: neighbour?.id });
  }

  function add(ids: string[]) {
    onChange([...value, ...ids]);
    setIsAdding(false);
  }

  return (
    <fieldset className={styles.root} aria-describedby={describedBy}>
      <legend className={styles.legend}>Работы</legend>
      <div
        className={clsx(
          styles.frame,
          isModified && styles.frameModified,
          Boolean(error) && styles.frameInvalid,
          disabled && styles.frameDisabled,
        )}
      >
        <div className={styles.scroller}>
          {chosen.length === 0 ? (
            <p className={styles.empty}>В коллекции пока нет работ</p>
          ) : (
            <ul className={styles.list}>
              {chosen.map((work) => {
                const removeLabel = `Убрать из коллекции ${work.title}`;

                return (
                  <li key={work.id} className={styles.row}>
                    <MediaImage
                      className={styles.photo}
                      source={imageToMediaItem(work.photo).source}
                    />
                    <span className={styles.title}>{work.title}</span>
                    <span className={styles.date}>{formatWorkDate(work)}</span>
                    <Tooltip content={removeLabel}>
                      <IconButton
                        ref={(button) => {
                          if (button) removeButtons.current.set(work.id, button);
                          else removeButtons.current.delete(work.id);
                        }}
                        label={removeLabel}
                        disabled={disabled}
                        onClick={() => remove(work.id)}
                      >
                        <TrashIcon className={styles.removeIcon} />
                      </IconButton>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <FieldHint id={hintId}>{hint}</FieldHint>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      <Button
        ref={addButton}
        className={styles.add}
        disabled={disabled}
        onClick={() => setIsAdding(true)}
      >
        Добавить работы
      </Button>
      <AddWorksDialog
        isOpen={isAdding}
        works={others}
        collections={collections}
        collectionId={collectionId}
        onAdd={add}
        onCancel={() => setIsAdding(false)}
      />
    </fieldset>
  );
}
