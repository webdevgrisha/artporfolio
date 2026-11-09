import type { GallerySectionBody } from "@/entities/gallery";
import type { SectionFormValues } from "./sectionFormSchema";

/** The section as the server takes it; the schema of the form has trimmed the titles. */
export function toSectionBody({ subsections, title }: SectionFormValues): GallerySectionBody {
  return { subsections, title };
}
