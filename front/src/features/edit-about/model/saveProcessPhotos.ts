import { replaceProcessPhotos } from "@/entities/about";
import type { Tagged } from "@/shared/api/http";
import type { ListPhoto } from "@/shared/api/photo";
import { type PhotoListRow, toPhotoListItems } from "@/shared/lib/photoListForm";

export interface SaveProcessPhotosParams {
  /** The ETag of the list the rows were made from. */
  etag: string;
  rows: readonly PhotoListRow[];
}

/**
 * Uploads the picked files, then replaces the list in one request, which the server saves all or
 * nothing. Until that request, nothing on the site changes. Returns the saved list.
 */
export async function saveProcessPhotos({
  etag,
  rows,
}: SaveProcessPhotosParams): Promise<Tagged<ListPhoto[]>> {
  return replaceProcessPhotos({ etag, processPhotos: await toPhotoListItems(rows) });
}
