import { containsText } from "@/shared/lib/containsText";

import type { GalleryWorkSummary } from "./galleryWork";

/** Whether the title of the work contains the query, in any case. */
export function matchesWorkQuery({ title }: GalleryWorkSummary, query: string): boolean {
  return containsText(title, query);
}
