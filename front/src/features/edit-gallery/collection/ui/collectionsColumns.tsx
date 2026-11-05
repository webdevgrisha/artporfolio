import type { ColumnDef } from "@tanstack/react-table";
import type { GalleryCollection } from "@/entities/gallery";
import { galleryCollectionPath } from "@/shared/config/routes";
import { compareText } from "@/shared/lib/compareText";
import { actionsColumn, positionColumn, RowActions, type TableRow } from "@/shared/ui/data-table";
import { PhotoThumbnail } from "@/shared/ui/media-preview";

import { compareCollectionYears } from "../model/collectionsTableView";
import { formatCollectionYears } from "../model/collectionYears";
import styles from "./CollectionsList.module.css";

interface CollectionsColumnsParams {
  /** The collections being deleted, by id. */
  deletingIds: readonly string[];
  onDelete: (collection: GalleryCollection) => void;
}

/** The columns of the table of collections. */
export function collectionsColumns({
  deletingIds,
  onDelete,
}: CollectionsColumnsParams): ColumnDef<TableRow<GalleryCollection>>[] {
  return [
    positionColumn({ isSortable: true }),
    {
      id: "cover",
      header: "Обложка",
      meta: { className: styles.coverColumn },
      enableSorting: false,
      cell: ({ row: { original } }) => <PhotoThumbnail image={original.item.cover} />,
    },
    {
      id: "title",
      header: "Название",
      accessorFn: (row) => row.item.title,
      sortingFn: (a, b) => compareText(a.original.item.title, b.original.item.title),
    },
    {
      id: "years",
      header: "Годы",
      meta: { className: styles.yearsColumn },
      accessorFn: (row) => row.item.startYear,
      sortingFn: (a, b) => compareCollectionYears(a.original.item, b.original.item),
      // The latest first, as the site shows them.
      sortDescFirst: true,
      cell: ({ row: { original } }) => formatCollectionYears(original.item),
    },
    {
      id: "works",
      header: "Работ",
      meta: { className: styles.countColumn },
      accessorFn: (row) => row.item.workIds.length,
      // The largest first: the useful start.
      sortDescFirst: true,
    },
    actionsColumn((collection) => (
      <RowActions
        title={collection.title}
        editTo={galleryCollectionPath(collection.id)}
        isDeleting={deletingIds.includes(collection.id)}
        onDelete={() => onDelete(collection)}
      />
    )),
  ];
}
