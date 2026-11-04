import clsx from "clsx";
import React from "react";
import { createPortal } from "react-dom";

import type { GalleryCollection, GalleryWork } from "@/entities/gallery";
import { useModalDialog } from "@/shared/lib/useModalDialog";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Frame,
  FrameEmpty,
  FrameList,
  FrameListItem,
  FrameRow,
  FrameRowLabel,
} from "@/shared/ui/frame-list";
import { PhotoThumbnail } from "@/shared/ui/media-preview";
import { SearchInput } from "@/shared/ui/search-input";

import { formatWorkDate } from "../model/workFormSchema";
import { matchesWorkQuery } from "../model/worksTableView";
import styles from "./AddWorksDialog.module.css";

interface AddWorksDialogProps {
  /** The collections of the gallery, to name the one a work is in now. */
  collections: readonly GalleryCollection[];
  /** The collection being edited; none for a new one. */
  collectionId?: string;
  isOpen: boolean;
  /** The gallery has no works at all, so there is nothing to add yet. */
  isGalleryEmpty: boolean;
  /** Called on the cancel button and on Escape. */
  onCancel: () => void;
  /** Gets the chosen works, by id. */
  onAdd: (ids: string[]) => void;
  /** The works to choose from, in the order the site shows them. */
  works: readonly GalleryWork[];
}

/**
 * Chooses works to add to a collection, by checkboxes, with a search in the titles. A work of
 * another collection says which: adding it moves it here once the collection is saved. The
 * choice starts empty each time the dialog opens.
 */
export function AddWorksDialog({
  collectionId,
  collections,
  isGalleryEmpty,
  isOpen,
  onAdd,
  onCancel,
  works,
}: AddWorksDialogProps) {
  const { dialogRef, handleCancel } = useModalDialog(isOpen, onCancel);
  const titleId = React.useId();
  const listId = React.useId();
  const [query, setQuery] = React.useState("");
  const [chosenIds, setChosenIds] = React.useState<readonly string[]>([]);
  const shownWorks = works.filter((work) => matchesWorkQuery(work, query));
  const collectionTitles = new Map(collections.map(({ id, title }) => [id, title]));

  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setChosenIds([]);
    }
  }, [isOpen]);

  function toggle(id: string, checked: boolean) {
    setChosenIds((current) =>
      checked ? [...current, id] : current.filter((chosenId) => chosenId !== id),
    );
  }

  /** Where the work is now, unless it is on its own or was taken out of this collection. */
  function currentCollection({ collectionId: workCollectionId }: GalleryWork): string | undefined {
    if (workCollectionId === null || workCollectionId === collectionId) return undefined;

    return collectionTitles.get(workCollectionId);
  }

  // In a portal: the dialog opens from a form, and inside it the search would belong to that form,
  // so Enter in the search would submit it.
  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.root}
      aria-labelledby={titleId}
      onCancel={handleCancel}
    >
      <h2 className={styles.title} id={titleId}>
        Добавить работы
      </h2>
      {/* showModal() focuses the first focusable element: the search. */}
      <SearchInput
        className={styles.search}
        label="Поиск по названию"
        clearLabel="Очистить поиск"
        value={query}
        summary={query ? `Найдено: ${String(shownWorks.length)} из ${String(works.length)}` : ""}
        onChange={setQuery}
      />
      <Frame className={styles.frame}>
        {works.length === 0 ? (
          <FrameEmpty>
            {isGalleryEmpty
              ? "В галерее пока нет работ"
              : "Все работы галереи уже в этой коллекции"}
          </FrameEmpty>
        ) : shownWorks.length === 0 ? (
          <FrameEmpty>Ничего не найдено по запросу «{query}»</FrameEmpty>
        ) : (
          <FrameList>
            {shownWorks.map((work) => {
              const checkboxId = `${listId}-${work.id}`;
              const collectionTitle = currentCollection(work);

              return (
                <FrameListItem key={work.id}>
                  <FrameRow className={styles.row}>
                    <PhotoThumbnail image={work.photo} />
                    <span className={styles.text}>
                      <FrameRowLabel htmlFor={checkboxId}>{work.title}</FrameRowLabel>
                      <span className={styles.details}>
                        {formatWorkDate(work)}
                        {collectionTitle === undefined ? null : (
                          <span className={styles.collection}>в коллекции «{collectionTitle}»</span>
                        )}
                      </span>
                    </span>
                    <Checkbox
                      id={checkboxId}
                      checked={chosenIds.includes(work.id)}
                      onChange={(checked) => toggle(work.id, checked)}
                    />
                  </FrameRow>
                </FrameListItem>
              );
            })}
          </FrameList>
        )}
      </Frame>
      <div className={styles.actions}>
        <p className={clsx(styles.count, chosenIds.length === 0 && styles.countEmpty)}>
          Выбрано: {chosenIds.length}
        </p>
        <Button className={styles.action} variant="text" onClick={onCancel}>
          Отмена
        </Button>
        <Button
          className={styles.action}
          variant="text"
          disabled={chosenIds.length === 0}
          onClick={() => onAdd([...chosenIds])}
        >
          Добавить
        </Button>
      </div>
    </dialog>,
    document.body,
  );
}
