import type { ColumnDef } from "@tanstack/react-table";
import type {
  GalleryCollection,
  GalleryMaterial,
  GallerySection,
  GalleryWorkSummary,
  WorkSaleStatus,
} from "@/entities/gallery";
import { galleryWorkPath } from "@/shared/config/routes";
import { compareText } from "@/shared/lib/compareText";
import { actionsColumn, positionColumn, RowActions, type TableRow } from "@/shared/ui/data-table";
import { PhotoThumbnail } from "@/shared/ui/media-preview";
import { formatWorkDate, formatWorkFormat, formatWorkSize } from "../model/workDisplay";
import { formatPrice } from "../model/workPrice";
import { titlesOf } from "../model/workReferences";
import { formatSaleStatus } from "../model/workSaleStatus";
import { sectionLabels } from "../model/workSections";
import { compareWorkDates, compareWorkSizes, formatWorkPlace } from "../model/worksTableView";
import { NoValue } from "./NoValue";
import styles from "./WorksList.module.css";

interface WorksColumnsParams {
  /** The collections of the gallery, to name the collection of each work. */
  collections: readonly GalleryCollection[];
  /** The works being deleted, by id. */
  deletingIds: readonly string[];
  /** The materials of the gallery, to name the materials of each work. */
  materials: readonly GalleryMaterial[];
  onDelete: (work: GalleryWorkSummary) => void;
  /** The sections of the gallery, to name the sections of each work. */
  sections: readonly GallerySection[];
}

const saleStatusClassNames: Record<WorkSaleStatus, string | undefined> = {
  available: styles.available,
  reserved: styles.reserved,
  sold: styles.sold,
  notForSale: styles.notForSale,
};

/** The columns of the table of works. */
export function worksColumns({
  collections,
  deletingIds,
  materials,
  onDelete,
  sections,
}: WorksColumnsParams): ColumnDef<TableRow<GalleryWorkSummary>>[] {
  const collectionTitles = new Map(collections.map(({ id, title }) => [id, title]));

  return [
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
      sortingFn: (a, b) => compareText(a.original.item.title, b.original.item.title),
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
      cell: ({ row: { original } }) => sectionLabels(original.item.sectionIds, sections).join(", "),
    },
    {
      id: "collection",
      header: "Коллекция",
      meta: { className: styles.collectionColumn },
      // Works on their own stay last either way.
      accessorFn: (row) =>
        row.item.collectionId === null ? undefined : collectionTitles.get(row.item.collectionId),
      sortingFn: (a, b) =>
        compareText(a.getValue<string>("collection"), b.getValue<string>("collection")),
      sortUndefined: "last",
      // Muted, as the form names it, so the works of collections stand out.
      cell: ({ getValue }) =>
        getValue<string | undefined>() ?? <span className={styles.muted}>Без коллекции</span>,
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

        if (price === null) return <NoValue label="Без цены" />;

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
    {
      id: "place",
      header: "Место",
      meta: { className: styles.placeColumn },
      // Works without a place stay last either way.
      accessorFn: (row) => formatWorkPlace(row.item) || undefined,
      sortingFn: (a, b) => compareText(a.getValue<string>("place"), b.getValue<string>("place")),
      sortUndefined: "last",
      cell: ({ getValue }) =>
        getValue<string | undefined>() ?? <NoValue label="Место не указано" />,
    },
    actionsColumn((work) => (
      <RowActions
        title={work.title}
        editTo={galleryWorkPath(work.id)}
        isDeleting={deletingIds.includes(work.id)}
        onDelete={() => onDelete(work)}
      />
    )),
  ];
}
