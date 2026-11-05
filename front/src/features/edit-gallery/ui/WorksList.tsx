import type { ColumnDef } from "@tanstack/react-table";
import React from "react";

import type {
  GalleryMaterial,
  GallerySection,
  GalleryWork,
  WorkSaleStatus,
} from "@/entities/gallery";
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
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { useDeleteWork, useDeletingWorkIds } from "../model/useDeleteWork";
import { formatWorkDate, formatWorkFormat, formatWorkSize } from "../model/workFormSchema";
import { formatPrice } from "../model/workPrice";
import { titlesOf } from "../model/workReferences";
import { formatSaleStatus } from "../model/workSaleStatus";
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

const saleStatusClassNames: Record<WorkSaleStatus, string | undefined> = {
  available: styles.available,
  reserved: styles.reserved,
  sold: styles.sold,
  notForSale: styles.notForSale,
};

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
        // A hidden work says so under its title, muted, as the discount is under the price.
        cell: ({ row: { original } }) => (
          <>
            {original.item.title}
            {original.item.published ? null : <div className={styles.muted}>скрыта</div>}
          </>
        ),
      },
      {
        id: "sections",
        header: "Разделы",
        meta: { className: styles.sectionsColumn },
        enableSorting: false,
        cell: ({ row: { original } }) =>
          sectionLabels(original.item.sectionIds, sections).join(", "),
      },
      {
        id: "materials",
        header: "Материалы",
        meta: { className: styles.materialsColumn },
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
        cell: ({ row: { original } }) => formatWorkSize(original.item.size),
      },
      {
        id: "format",
        header: "Формат",
        meta: { className: styles.formatColumn },
        enableSorting: false,
        // A single work, the usual one, muted, so the diptychs and the sets stand out.
        cell: ({ row: { original } }) => (
          <span className={original.item.format === "single" ? styles.muted : undefined}>
            {formatWorkFormat(original.item)}
          </span>
        ),
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

          // A muted dash for no price, so the cell doesn't read as not loaded; a screen reader
          // hears the words instead of «тире».
          if (price === null) {
            return (
              <>
                <span className={styles.muted} aria-hidden="true">
                  —
                </span>
                <VisuallyHidden>Без цены</VisuallyHidden>
              </>
            );
          }

          // The discount under the price, muted.
          return (
            <>
              {formatPrice(price.finalAmount, price.currency)}
              {price.discountPercent === null ? null : (
                <div className={styles.muted}>
                  −{price.discountPercent}% от {formatPrice(price.amount, price.currency)}
                </div>
              )}
            </>
          );
        },
      },
      {
        id: "saleStatus",
        header: "Статус",
        meta: { className: styles.saleStatusColumn },
        enableSorting: false,
        cell: ({ row: { original } }) => (
          <span className={saleStatusClassNames[original.item.saleStatus]}>
            {formatSaleStatus(original.item.saleStatus)}
          </span>
        ),
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
