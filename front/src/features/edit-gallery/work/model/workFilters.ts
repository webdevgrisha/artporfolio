import type {
  GalleryCollection,
  GalleryMaterial,
  GallerySection,
  GalleryWorkSummary,
} from "@/entities/gallery";
import type { TableFilter } from "@/shared/lib/tableView";

import { toCollectionOptions, toTitleOptions } from "./workReferences";
import { workSaleStatusOptions } from "./workSaleStatus";
import { toSectionOptions } from "./workSections";

/** The value of the collection filter for works on their own; a collection id is a UUID. */
const noCollection = "none";

/** Whether the work is in the section or the subsection; a section holds its subsections' works. */
function isInSection(
  { sectionIds }: GalleryWorkSummary,
  id: string,
  sections: readonly GallerySection[],
): boolean {
  const subsections = sections.find((section) => section.id === id)?.subsections ?? [];

  return [id, ...subsections.map((subsection) => subsection.id)].some((sectionId) =>
    sectionIds.includes(sectionId),
  );
}

/** The filters over the table of works, by the lists of the gallery. */
export function createWorkFilters(
  collections: readonly GalleryCollection[],
  materials: readonly GalleryMaterial[],
  sections: readonly GallerySection[],
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
