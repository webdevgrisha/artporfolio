import type { ColumnDef } from "@tanstack/react-table";
import type {
  GalleryCollectionSummary,
  GalleryMaterial,
  GallerySectionSummary,
  GalleryWorkSummary,
} from "@/entities/gallery";
import { galleryWorkPath } from "@/shared/config/routes";
import { compareText } from "@/shared/lib/compareText";
import { actionsColumn, positionColumn, RowActions, type TableRow } from "@/shared/ui/data-table";
import { PhotoThumbnail } from "@/shared/ui/media-preview";
import { formatWorkDate, formatWorkSize } from "../model/workDisplay";
import { titlesOf } from "../model/workReferences";
import { sectionLabels } from "../model/workSections";
import { compareWorkDates, compareWorkSizes, formatWorkPlace } from "../model/worksTableView";
import { NoValue } from "./NoValue";
import { WorkFormatCell } from "./WorkFormatCell";
import { WorkPriceCell } from "./WorkPriceCell";
import { WorkSaleStatusCell } from "./WorkSaleStatusCell";
import styles from "./WorksList.module.css";
import { WorkTitleCell } from "./WorkTitleCell";

interface WorksColumnsParams {
  /** The collections of the gallery, to name the collection of each work. */
  collections: readonly GalleryCollectionSummary[];
  /** The works being deleted, by id. */
  deletingIds: readonly string[];
  /** The materials of the gallery, to name the materials of each work. */
  materials: readonly GalleryMaterial[];
  onDelete: (work: GalleryWorkSummary) => void;
  /** The sections of the gallery, to name the sections of each work. */
  sections: readonly GallerySectionSummary[];
}

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
      cell: ({ row: { original } }) => <WorkTitleCell work={original.item} />,
    },
    {
      id: "sections",
      header: "Разделы",
      meta: { className: styles.sectionsColumn, hiddenOnPhone: true },
      enableSorting: false,
      cell: ({ row: { original } }) => sectionLabels(original.item.sectionIds, sections).join(", "),
    },
    {
      id: "collection",
      header: "Коллекция",
      meta: { className: styles.collectionColumn, hiddenOnPhone: true },
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
      meta: { className: styles.materialsColumn, hiddenOnPhone: true },
      enableSorting: false,
      cell: ({ row: { original } }) => titlesOf(original.item.materialIds, materials).join(", "),
    },
    {
      id: "size",
      header: "Размер",
      meta: { className: styles.sizeColumn, hiddenOnPhone: true },
      accessorFn: (row) => row.item.size,
      sortingFn: (a, b) => compareWorkSizes(a.original.item, b.original.item),
      // The smallest first would read as a step back; the largest first is the useful start.
      sortDescFirst: true,
      cell: ({ row: { original } }) => formatWorkSize(original.item.size),
    },
    {
      id: "format",
      header: "Формат",
      meta: { className: styles.formatColumn, hiddenOnPhone: true },
      enableSorting: false,
      cell: ({ row: { original } }) => <WorkFormatCell work={original.item} />,
    },
    {
      id: "price",
      header: "Цена",
      meta: { className: styles.priceColumn, hiddenOnPhone: true },
      // The price a visitor pays; works without a price stay last either way.
      accessorFn: (row) => row.item.price?.finalAmount,
      sortingFn: "basic",
      sortUndefined: "last",
      cell: ({ row: { original } }) => <WorkPriceCell price={original.item.price} />,
    },
    {
      id: "saleStatus",
      header: "Статус",
      meta: { className: styles.saleStatusColumn, hiddenOnPhone: true },
      enableSorting: false,
      cell: ({ row: { original } }) => <WorkSaleStatusCell saleStatus={original.item.saleStatus} />,
    },
    {
      id: "date",
      header: "Дата",
      meta: { className: styles.dateColumn, hiddenOnPhone: true },
      accessorFn: (row) => row.item.year,
      sortingFn: (a, b) => compareWorkDates(a.original.item, b.original.item),
      // The latest first, as the site shows them.
      sortDescFirst: true,
      cell: ({ row: { original } }) => formatWorkDate(original.item),
    },
    {
      id: "place",
      header: "Место",
      meta: { className: styles.placeColumn, hiddenOnPhone: true },
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
