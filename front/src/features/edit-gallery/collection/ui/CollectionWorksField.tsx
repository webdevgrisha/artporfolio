import React from "react";

import { formatWorkDate, type GalleryWorkSummary } from "@/entities/gallery";
import { useFocusAfterUpdate } from "@/shared/lib/useFocusAfterUpdate";
import { Button } from "@/shared/ui/button";
import { Fieldset } from "@/shared/ui/fieldset";
import { Frame, FrameEmpty, FrameList, FrameListItem, FrameRow } from "@/shared/ui/frame-list";
import { TrashIcon } from "@/shared/ui/icon";
import { IconAction } from "@/shared/ui/icon-button";
import { PhotoThumbnail } from "@/shared/ui/media-preview";

import { addableWorks } from "../model/addableWorks";
import { AddWorksDialog } from "./AddWorksDialog";
import styles from "./CollectionWorksField.module.css";

interface CollectionWorksFieldProps {
  /** The collection being edited; none for a new one. */
  collectionId?: string;
  disabled: boolean;
  error?: string;
  /** Whether the works differ from the saved ones. */
  isModified: boolean;
  /** Gets the ids of the works after a work is added or taken out. */
  onChange: (ids: string[]) => void;
  /** The works of the collection, by id. */
  value: readonly string[];
  /** Every work of the gallery, in the order the site shows them. */
  works: readonly GalleryWorkSummary[];
}

/**
 * The works of a collection, in a frame, in the order the site shows them: the latest first. Works
 * are added from a dialog under the frame; a work is taken out by the trash button and stays in the
 * gallery, on its own.
 */
export function CollectionWorksField({
  collectionId,
  disabled,
  error,
  isModified,
  onChange,
  value,
  works,
}: CollectionWorksFieldProps) {
  const chosen = works.filter((work) => value.includes(work.id));
  const addable = addableWorks(works, value, collectionId);
  const [isAdding, setIsAdding] = React.useState(false);
  const removeButtons = React.useRef(new Map<string, HTMLButtonElement>());
  const addButton = React.useRef<HTMLButtonElement>(null);
  const focusAfterUpdate = useFocusAfterUpdate();

  function remove(id: string) {
    const index = chosen.findIndex((work) => work.id === id);
    const neighbour = chosen[index + 1] ?? chosen[index - 1];

    onChange(value.filter((chosenId) => chosenId !== id));
    // The button of the next row, or the adding when no row is left, so the focus stays in the
    // field instead of falling to the page.
    focusAfterUpdate(() => {
      (neighbour ? removeButtons.current.get(neighbour.id) : addButton.current)?.focus();
    });
  }

  function add(ids: string[]) {
    onChange([...value, ...ids]);
    setIsAdding(false);
  }

  return (
    <div className={styles.root}>
      <Fieldset legend="Работы" hint="На сайте идут по дате, сначала новые" error={error}>
        <Frame
          className={styles.frame}
          isModified={isModified}
          invalid={Boolean(error)}
          disabled={disabled}
        >
          {chosen.length === 0 ? (
            <FrameEmpty>В коллекции пока нет работ</FrameEmpty>
          ) : (
            <FrameList>
              {chosen.map((work) => {
                const removeLabel = `Убрать из коллекции ${work.title}`;

                return (
                  <FrameListItem key={work.id}>
                    <FrameRow className={styles.row}>
                      <PhotoThumbnail image={work.photo} />
                      <span className={styles.title}>{work.title}</span>
                      <span className={styles.date}>{formatWorkDate(work)}</span>
                      <IconAction
                        ref={(button) => {
                          if (button) removeButtons.current.set(work.id, button);
                          else removeButtons.current.delete(work.id);
                        }}
                        label={removeLabel}
                        disabled={disabled}
                        onClick={() => remove(work.id)}
                      >
                        <TrashIcon className={styles.removeIcon} />
                      </IconAction>
                    </FrameRow>
                  </FrameListItem>
                );
              })}
            </FrameList>
          )}
        </Frame>
      </Fieldset>
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
        isGalleryEmpty={works.length === 0}
        works={addable}
        onAdd={add}
        onCancel={() => setIsAdding(false)}
      />
    </div>
  );
}
