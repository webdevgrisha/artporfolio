import clsx from "clsx";
import React from "react";

import type { GallerySection } from "@/entities/gallery";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

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
 * Every section with its subsections, by title as on the site. A section opens for editing by the
 * pencil and is deleted after a confirmation.
 */
export function SectionsList({ className, sections }: SectionsListProps) {
  const deletion = useDeleteSection();
  const [deleted, setDeleted] = React.useState<GallerySection>();

  return (
    <div className={clsx(styles.root, className)}>
      {sections.length === 0 ? (
        <p className={styles.empty}>Разделов пока нет</p>
      ) : (
        <div className={styles.scroller}>
          <table className={styles.table}>
            <caption>
              <VisuallyHidden>Разделы галереи</VisuallyHidden>
            </caption>
            <thead>
              <tr>
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
              {sections.map((section) => (
                <tr key={section.id} className={styles.row}>
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
