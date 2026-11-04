import clsx from "clsx";
import React from "react";
import { useSearchParams } from "react-router";

import type { GalleryCollection } from "@/entities/gallery";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { imageToMediaItem, MediaImage } from "@/shared/ui/media-preview";
import { SearchInput } from "@/shared/ui/search-input";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";
import { collectionsSearchParam, matchesCollectionQuery } from "../model/collectionsSearch";
import { formatCollectionYears } from "../model/collectionYears";
import { useDeleteCollection } from "../model/useDeleteCollection";
import { CollectionActions } from "./CollectionActions";
import styles from "./CollectionsList.module.css";

interface CollectionsListProps {
  className?: string;
  /** In the order the site shows them: the latest first. */
  collections: readonly GalleryCollection[];
}

/** What deleting the collection does to its works, which stay in the gallery. */
function deletionDescription(count: number): string {
  if (count === 0) return "Коллекция пропадёт с сайта. Это нельзя отменить.";

  const plural = new Intl.PluralRules("ru").select(count);
  const noun = plural === "one" ? "работа" : plural === "few" ? "работы" : "работ";
  const verb = plural === "one" ? "останется" : "останутся";

  return `Коллекция пропадёт с сайта, её ${String(count)} ${noun} ${verb} в галерее без коллекции. Это нельзя отменить.`;
}

/**
 * Every collection, in the order of the site; the numbers show how many there are and stay with
 * their rows while searching. The search, in the titles, is kept in the address; a new collection
 * is added from beside it. A collection opens for editing by the pencil and is deleted after a
 * confirmation.
 */
export function CollectionsList({ className, collections }: CollectionsListProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get(collectionsSearchParam) ?? "";
  const deletion = useDeleteCollection();
  const [deleted, setDeleted] = React.useState<GalleryCollection>();
  const shownRows = collections
    .map((collection, index) => ({ collection, position: index + 1 }))
    .filter(({ collection }) => matchesCollectionQuery(collection, query));

  function changeQuery(next: string) {
    const params = new URLSearchParams(searchParams);

    if (next) params.set(collectionsSearchParam, next);
    else params.delete(collectionsSearchParam);
    // Replaces the entry: the back button leaves the table instead of undoing each letter.
    setSearchParams(params, { replace: true });
  }

  return (
    <div className={clsx(styles.root, className)}>
      <div className={styles.toolbar}>
        <SearchInput
          className={styles.search}
          label="Поиск по названию"
          clearLabel="Очистить поиск"
          value={query}
          summary={
            query ? `Найдено: ${String(shownRows.length)} из ${String(collections.length)}` : ""
          }
          onChange={changeQuery}
        />
        <ButtonLink to={routes.galleryCollectionNew}>Добавить коллекцию</ButtonLink>
      </div>

      {collections.length === 0 ? (
        <p className={styles.empty}>Коллекций пока нет</p>
      ) : shownRows.length === 0 ? (
        <div className={styles.empty}>
          <p>Ничего не найдено по запросу «{query}»</p>
          <Button variant="text" onClick={() => changeQuery("")}>
            Сбросить поиск
          </Button>
        </div>
      ) : (
        <div className={styles.scroller}>
          <table className={styles.table}>
            <caption>
              <VisuallyHidden>Коллекции</VisuallyHidden>
            </caption>
            <thead>
              <tr>
                <th className={styles.positionColumn} scope="col">
                  №
                </th>
                <th className={styles.coverColumn} scope="col">
                  Обложка
                </th>
                <th scope="col">Название</th>
                <th className={styles.yearsColumn} scope="col">
                  Годы
                </th>
                <th className={styles.countColumn} scope="col">
                  Работ
                </th>
                <th className={styles.actionsColumn} scope="col">
                  <VisuallyHidden>Действия</VisuallyHidden>
                </th>
              </tr>
            </thead>
            <tbody>
              {shownRows.map(({ collection, position }) => (
                <tr key={collection.id} className={styles.row}>
                  <td className={clsx(styles.positionColumn, styles.muted)}>{position}</td>
                  <td className={styles.coverColumn}>
                    <MediaImage
                      className={styles.cover}
                      source={imageToMediaItem(collection.cover).source}
                    />
                  </td>
                  <td>{collection.title}</td>
                  <td className={styles.yearsColumn}>{formatCollectionYears(collection)}</td>
                  <td className={styles.countColumn}>{collection.workIds.length}</td>
                  <td className={styles.actionsColumn}>
                    <CollectionActions collection={collection} onDelete={setDeleted} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleted !== undefined}
        title={`Удалить коллекцию «${deleted?.title ?? ""}»?`}
        description={deletionDescription(deleted?.workIds.length ?? 0)}
        cancelLabel="Отмена"
        confirmLabel="Удалить"
        onCancel={() => setDeleted(undefined)}
        onConfirm={() => {
          if (deleted) deletion.mutate(deleted);
          setDeleted(undefined);
        }}
      />
    </div>
  );
}
