import clsx from "clsx";
import React from "react";

import type { GalleryCollection, GalleryWork } from "@/entities/gallery";
import { useModalDialog } from "@/shared/lib/useModalDialog";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { imageToMediaItem, MediaImage } from "@/shared/ui/media-preview";
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

  return (
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
      <div className={styles.frame}>
        {works.length === 0 ? (
          <p className={styles.empty}>Все работы галереи уже в этой коллекции</p>
        ) : shownWorks.length === 0 ? (
          <p className={styles.empty}>Ничего не найдено по запросу «{query}»</p>
        ) : (
          <ul className={styles.list} id={listId}>
            {shownWorks.map((work) => {
              const checkboxId = `${listId}-${work.id}`;
              const collectionTitle = currentCollection(work);

              return (
                <li key={work.id} className={styles.row}>
                  <MediaImage
                    className={styles.photo}
                    source={imageToMediaItem(work.photo).source}
                  />
                  <span className={styles.text}>
                    <label className={styles.label} htmlFor={checkboxId}>
                      {work.title}
                    </label>
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
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
    </dialog>
  );
}
