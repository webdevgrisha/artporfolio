import clsx from "clsx";
import React from "react";

import type { GalleryWork } from "@/entities/gallery";
import { FieldError, FieldHint, useFieldIds } from "@/shared/ui/field";
import { TrashIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { imageToMediaItem, MediaImage } from "@/shared/ui/media-preview";
import { Tooltip } from "@/shared/ui/tooltip";

import { formatWorkDate } from "../model/workFormSchema";
import styles from "./CollectionWorksField.module.css";

interface CollectionWorksFieldProps {
  disabled: boolean;
  error?: string;
  /** Whether the works differ from the saved ones. */
  isModified: boolean;
  /** Gets the ids of the works left. */
  onChange: (ids: string[]) => void;
  /** The works of the collection, by id. */
  value: readonly string[];
  /** Every work of the gallery, in the order the site shows them. */
  works: readonly GalleryWork[];
}

/**
 * The works of a collection, in a frame, in the order the site shows them: the latest first. A
 * work is taken out by the trash button; it stays in the gallery, on its own.
 */
export function CollectionWorksField({
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
  const removeButtons = React.useRef(new Map<string, HTMLButtonElement>());
  // The work whose button takes the focus once a removed row is gone, so the focus stays in the
  // list instead of falling to the page.
  const [focusedId, setFocusedId] = React.useState<string>();

  React.useEffect(() => {
    if (focusedId === undefined) return;

    removeButtons.current.get(focusedId)?.focus();
    setFocusedId(undefined);
  }, [focusedId]);

  function remove(id: string) {
    const index = chosen.findIndex((work) => work.id === id);
    const neighbour = chosen[index + 1] ?? chosen[index - 1];

    onChange(value.filter((chosenId) => chosenId !== id));
    setFocusedId(neighbour?.id);
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
      <FieldHint id={hintId}>{hint}</FieldHint>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </fieldset>
  );
}
