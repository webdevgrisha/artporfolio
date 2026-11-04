import type { ColumnDef } from "@tanstack/react-table";
import React from "react";

import type { GalleryMaterial, GallerySection, GalleryWork } from "@/entities/gallery";
import { galleryWorkPath, routes } from "@/shared/config/routes";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  actionsColumn,
  DataTable,
  positionColumn,
  RowActions,
  type TableRow,
} from "@/shared/ui/data-table";
import { PhotoThumbnail } from "@/shared/ui/media-preview";

import { useDeleteWork, useDeletingWorkIds } from "../model/useDeleteWork";
import { formatWorkDate, formatWorkFormat, formatWorkSize } from "../model/workFormSchema";
import { formatPrice } from "../model/workPrice";
import { titlesOf } from "../model/workReferences";
import { sectionLabels } from "../model/workSections";
import {
  compareWorkDates,
  compareWorkSizes,
  matchesWorkQuery,
  worksSortableColumns,
} from "../model/worksTableView";
import styles from "./WorksList.module.css";

interface WorksListProps {
  className?: string;
  /** In the order the site shows them: the latest first. */
  works: readonly GalleryWork[];
  /** The sections of the gallery, to name the sections of each work. */
  sections: readonly GallerySection[];
  /** The materials of the gallery, to name the materials of each work. */
  materials: readonly GalleryMaterial[];
}

const collator = new Intl.Collator("ru", { sensitivity: "base" });

/** Every work, in a table; a work opens by the pencil and is deleted after a confirmation. */
export function WorksList({ className, materials, sections, works }: WorksListProps) {
  const deletion = useDeleteWork();
  const deletingIds = useDeletingWorkIds();
  const [deleted, setDeleted] = React.useState<GalleryWork>();

  const columns = React.useMemo<ColumnDef<TableRow<GalleryWork>>[]>(
    () => [
      positionColumn({ isSortable: true }),
      {
        id: "photo",
        header: "Фото",
        meta: { className: styles.photoColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => <PhotoThumbnail image={original.item.photo} />,
      },
      {
        id: "title",
        header: "Название",
        accessorFn: (row) => row.item.title,
        sortingFn: (a, b) => collator.compare(a.original.item.title, b.original.item.title),
      },
      {
        id: "sections",
        header: "Разделы",
        enableSorting: false,
        cell: ({ row: { original } }) =>
          sectionLabels(original.item.sectionIds, sections).join(", "),
      },
      {
        id: "materials",
        header: "Материалы",
        enableSorting: false,
        cell: ({ row: { original } }) => titlesOf(original.item.materialIds, materials).join(", "),
      },
      {
        id: "size",
        header: "Размер",
        meta: { className: styles.sizeColumn },
        accessorFn: (row) => row.item.size,
        sortingFn: (a, b) => compareWorkSizes(a.original.item, b.original.item),
        // The smallest first would read as a step back; the largest first is the useful start.
        sortDescFirst: true,
        cell: ({ row: { original } }) => {
          const format = formatWorkFormat(original.item);

          // The format under the size, muted: «диптих», «12 шт.»; a single work has none.
          return (
            <>
              {formatWorkSize(original.item.size)}
              {format === null ? null : <div className={styles.format}>{format}</div>}
            </>
          );
        },
      },
      {
        id: "price",
        header: "Цена",
        meta: { className: styles.priceColumn },
        // The price a visitor pays; works without a price stay last either way.
        accessorFn: (row) => row.item.price?.finalAmount,
        sortingFn: "basic",
        sortUndefined: "last",
        cell: ({ row: { original } }) => {
          const { price } = original.item;

          if (price === null) {
            return null;
          }

          // The discount under the price, muted, with the price it is taken off.
          return (
            <>
              {formatPrice(price.finalAmount, price.currency)}
              {price.discountPercent === null ? null : (
                <div className={styles.discount}>
                  −{price.discountPercent}% от {formatPrice(price.amount, price.currency)}
                </div>
              )}
            </>
          );
        },
      },
      {
        id: "date",
        header: "Дата",
        meta: { className: styles.dateColumn },
        accessorFn: (row) => row.item.year,
        sortingFn: (a, b) => compareWorkDates(a.original.item, b.original.item),
        // The latest first, as the site shows them.
        sortDescFirst: true,
        cell: ({ row: { original } }) => formatWorkDate(original.item),
      },
      actionsColumn((work) => (
        <RowActions
          title={work.title}
          editTo={galleryWorkPath(work.id)}
          isDeleting={deletingIds.includes(work.id)}
          onDelete={() => setDeleted(work)}
        />
      )),
    ],
    [deletingIds, materials, sections],
  );

  return (
    <>
      <DataTable
        className={className}
        tableClassName={styles.table}
        caption="Все работы"
        columns={columns}
        items={works}
        getId={(work) => work.id}
        matches={matchesWorkQuery}
        sortableColumns={worksSortableColumns}
        searchLabel="Поиск по названию"
        addLink={{ label: "Добавить работу", to: routes.galleryWorkNew }}
        emptyText="Работ пока нет"
      />
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
    </>
  );
}
