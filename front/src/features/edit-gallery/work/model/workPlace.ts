import type { GalleryWorkSummary } from "@/entities/gallery";
import { countryName } from "@/shared/lib/countries";

/** Where the work was made, as «Польша, Краков»; an empty string when neither is given. */
export function formatWorkPlace({ city, country }: GalleryWorkSummary): string {
  return [country === null ? "" : countryName(country), city]
    .filter((part) => part !== "")
    .join(", ");
}
