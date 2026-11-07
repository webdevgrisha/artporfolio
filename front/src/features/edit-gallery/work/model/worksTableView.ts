import type {
  GalleryCollectionSummary,
  GalleryMaterial,
  GallerySectionSummary,
  GalleryWorkSummary,
} from "@/entities/gallery";
import { containsText } from "@/shared/lib/containsText";
import { countryName } from "@/shared/lib/countries";
import type { TableFilter } from "@/shared/lib/tableView";

import { toCollectionOptions, toTitleOptions } from "./workReferences";
import { workSaleStatusOptions } from "./workSaleStatus";
import { toSectionOptions } from "./workSections";

/** The columns the table sorts by, as named in the address. */
export const worksSortableColumns = [
  "position",
  "title",
  "collection",
  "size",
  "price",
  "date",
  "place",
] as const;

/** The value of the collection filter for works on their own; a collection id is a UUID. */
const noCollection = "none";

/** Whether the work is in the section or the subsection; a section holds its subsections' works. */
function isInSection(
  { sectionIds }: GalleryWorkSummary,
  id: string,
  sections: readonly GallerySectionSummary[],
): boolean {
  const subsections = sections.find((section) => section.id === id)?.subsections ?? [];

  return [id, ...subsections.map((subsection) => subsection.id)].some((sectionId) =>
    sectionIds.includes(sectionId),
  );
}

/** The filters over the table of works, by the lists of the gallery. */
export function createWorkFilters(
  collections: readonly GalleryCollectionSummary[],
  materials: readonly GalleryMaterial[],
  sections: readonly GallerySectionSummary[],
): TableFilter<GalleryWorkSummary>[] {
  return [
    {
      id: "section",
      label: "Раздел",
      matches: (work, value) => isInSection(work, value, sections),
      options: toSectionOptions(sections),
    },
    {
      id: "collection",
      label: "Коллекция",
      matches: ({ collectionId }, value) => (collectionId ?? noCollection) === value,
      options: toCollectionOptions(collections).map((option) =>
        option.value === "" ? { ...option, value: noCollection } : option,
      ),
    },
    {
      id: "status",
      label: "Статус",
      matches: ({ saleStatus }, value) => saleStatus === value,
      options: workSaleStatusOptions,
    },
    {
      id: "material",
      label: "Материал",
      matches: ({ materialIds }, value) => materialIds.includes(value),
      options: toTitleOptions(materials),
    },
  ];
}

/** Whether the title of the work contains the query, in any case. */
export function matchesWorkQuery({ title }: GalleryWorkSummary, query: string): boolean {
  return containsText(title, query);
}

/** By the area of the work, the smaller first; works of one area by the width. */
export function compareWorkSizes(
  { size: a }: GalleryWorkSummary,
  { size: b }: GalleryWorkSummary,
): number {
  return a.width * a.height - b.width * b.height || a.width - b.width;
}

/** By the month the work was finished, the earlier first. */
export function compareWorkDates(a: GalleryWorkSummary, b: GalleryWorkSummary): number {
  return a.year - b.year || a.month - b.month;
}

/** Where the work was made, as «Польша, Краков»; an empty string when neither is given. */
export function formatWorkPlace({ city, country }: GalleryWorkSummary): string {
  return [country === null ? "" : countryName(country), city]
    .filter((part) => part !== "")
    .join(", ");
}
