import type { GallerySection } from "@/entities/gallery";
import type { MultiSelectOption } from "@/shared/ui/multi-select";

/** The name of a subsection with its section, as the list of a work shows it. */
function subsectionLabel(section: GallerySection, subsectionTitle: string): string {
  return `${section.title} › ${subsectionTitle}`;
}

/**
 * The sections and subsections a work can be in, as the site lists them: each section, sorted by
 * title, followed by its subsections.
 */
export function toSectionOptions(sections: readonly GallerySection[]): MultiSelectOption[] {
  return sections.flatMap((section) => [
    { label: section.title, value: section.id },
    ...section.subsections.map((subsection) => ({
      label: subsectionLabel(section, subsection.title),
      value: subsection.id,
    })),
  ]);
}

/** The names of the sections a work is in, in the order of the list; unknown ids are skipped. */
export function sectionLabels(
  ids: readonly string[],
  sections: readonly GallerySection[],
): string[] {
  return toSectionOptions(sections)
    .filter((option) => ids.includes(option.value))
    .map((option) => option.label);
}
