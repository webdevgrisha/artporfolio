import clsx from "clsx";
import React from "react";

import { useSearchParams } from "react-router";

import type { GallerySection } from "@/entities/gallery";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { SearchInput } from "@/shared/ui/search-input";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { matchesSectionQuery, searchParam } from "../model/sectionsSearch";
import { useDeleteSection } from "../model/useDeleteSection";
import { SectionActions } from "./SectionActions";
import styles from "./SectionsList.module.css";

interface SectionsListProps {
  className?: string;
  /** Sorted by title, as the site shows them. */
  sections: readonly GallerySection[];
}

/** What the deletion of the section takes from the site, its subsections included. */
function deletionDescription({ subsections }: GallerySection): string {
  const count = subsections.length;

  if (count === 0) return "Раздел пропадёт с сайта. Это нельзя отменить.";

  const plural = new Intl.PluralRules("ru").select(count);
  const noun = plural === "one" ? "подраздел" : plural === "few" ? "подраздела" : "подразделов";

  return `Раздел и ${String(count)} ${noun} пропадут с сайта. Это нельзя отменить.`;
}

/**
 * Every section with its subsections, by title as on the site; the numbers show how many there
 * are and stay with their rows while searching. The search, in the titles of the sections and
 * their subsections, is kept in the address. A section opens for editing by the pencil and is
 * deleted after a confirmation.
 */
export function SectionsList({ className, sections }: SectionsListProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get(searchParam) ?? "";
  const deletion = useDeleteSection();
  const [deleted, setDeleted] = React.useState<GallerySection>();
  const shownRows = sections
    .map((section, index) => ({ position: index + 1, section }))
    .filter(({ section }) => matchesSectionQuery(section, query));

  function changeQuery(next: string) {
    const params = new URLSearchParams(searchParams);

    if (next) params.set(searchParam, next);
    else params.delete(searchParam);
    // Replaces the entry: the back button leaves the table instead of undoing each letter.
    setSearchParams(params, { replace: true });
  }

  return (
    <div className={clsx(styles.root, className)}>
      <SearchInput
        label="Поиск по разделам и подразделам"
        clearLabel="Очистить поиск"
        value={query}
        summary={query ? `Найдено: ${String(shownRows.length)} из ${String(sections.length)}` : ""}
        onChange={changeQuery}
      />

      {sections.length === 0 ? (
        <p className={styles.empty}>Разделов пока нет</p>
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
              <VisuallyHidden>Разделы галереи</VisuallyHidden>
            </caption>
            <thead>
              <tr>
                <th className={styles.positionColumn} scope="col">
                  №
                </th>
                <th className={styles.titleColumn} scope="col">
                  Раздел
                </th>
                <th scope="col">Подразделы</th>
                <th className={styles.actionsColumn} scope="col">
                  <VisuallyHidden>Действия</VisuallyHidden>
                </th>
              </tr>
            </thead>
            <tbody>
              {shownRows.map(({ position, section }) => (
                <tr key={section.id} className={styles.row}>
                  <td className={clsx(styles.positionColumn, styles.muted)}>{position}</td>
                  <td className={styles.titleColumn}>{section.title}</td>
                  <td>
                    {section.subsections.length > 0 ? (
                      section.subsections.map((subsection) => subsection.title).join(", ")
                    ) : (
                      <span className={styles.muted}>Нет</span>
                    )}
                  </td>
                  <td className={styles.actionsColumn}>
                    <SectionActions section={section} onDelete={setDeleted} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleted !== undefined}
        title={`Удалить раздел «${deleted?.title ?? ""}»?`}
        description={deleted ? deletionDescription(deleted) : ""}
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
