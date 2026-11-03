import clsx from "clsx";
import React from "react";
import { useSearchParams } from "react-router";

import type { GallerySection, GalleryWork } from "@/entities/gallery";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { imageToMediaItem, MediaImage } from "@/shared/ui/media-preview";
import { SearchInput } from "@/shared/ui/search-input";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { useDeleteWork } from "../model/useDeleteWork";
import { formatWorkDate, formatWorkSize } from "../model/workFormSchema";
import { sectionLabels } from "../model/workSections";
import { matchesWorkQuery, worksSearchParam } from "../model/worksSearch";
import { WorkActions } from "./WorkActions";
import styles from "./WorksList.module.css";

interface WorksListProps {
  className?: string;
  /** In the order the site shows them: the latest first. */
  works: readonly GalleryWork[];
  /** The sections of the gallery, to name the sections of each work. */
  sections: readonly GallerySection[];
}

/**
 * Every work, in the order of the site; the numbers show how many there are and stay with their
 * rows while searching. The search, in the titles, is kept in the address; a new work is added
 * from beside it. A work opens for editing by the pencil and is deleted after a confirmation.
 */
export function WorksList({ className, sections, works }: WorksListProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get(worksSearchParam) ?? "";
  const deletion = useDeleteWork();
  const [deleted, setDeleted] = React.useState<GalleryWork>();
  const shownRows = works
    .map((work, index) => ({ position: index + 1, work }))
    .filter(({ work }) => matchesWorkQuery(work, query));

  function changeQuery(next: string) {
    const params = new URLSearchParams(searchParams);

    if (next) params.set(worksSearchParam, next);
    else params.delete(worksSearchParam);
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
          summary={query ? `Найдено: ${String(shownRows.length)} из ${String(works.length)}` : ""}
          onChange={changeQuery}
        />
        <ButtonLink to={routes.galleryWorkNew}>Добавить работу</ButtonLink>
      </div>

      {works.length === 0 ? (
        <p className={styles.empty}>Работ пока нет</p>
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
              <VisuallyHidden>Все работы</VisuallyHidden>
            </caption>
            <thead>
              <tr>
                <th className={styles.positionColumn} scope="col">
                  №
                </th>
                <th className={styles.photoColumn} scope="col">
                  Фото
                </th>
                <th scope="col">Название</th>
                <th scope="col">Разделы</th>
                <th className={styles.sizeColumn} scope="col">
                  Размер
                </th>
                <th className={styles.dateColumn} scope="col">
                  Дата
                </th>
                <th className={styles.actionsColumn} scope="col">
                  <VisuallyHidden>Действия</VisuallyHidden>
                </th>
              </tr>
            </thead>
            <tbody>
              {shownRows.map(({ position, work }) => (
                <tr key={work.id} className={styles.row}>
                  <td className={clsx(styles.positionColumn, styles.muted)}>{position}</td>
                  <td className={styles.photoColumn}>
                    <MediaImage
                      className={styles.photo}
                      source={imageToMediaItem(work.photo).source}
                    />
                  </td>
                  <td>{work.title}</td>
                  <td>{sectionLabels(work.sectionIds, sections).join(", ")}</td>
                  <td className={styles.sizeColumn}>{formatWorkSize(work.size)}</td>
                  <td className={styles.dateColumn}>{formatWorkDate(work)}</td>
                  <td className={styles.actionsColumn}>
                    <WorkActions work={work} onDelete={setDeleted} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleted !== undefined}
        title={`Удалить работу «${deleted?.title ?? ""}»?`}
        description="Работа и все её фото пропадут с сайта. Это нельзя отменить."
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
