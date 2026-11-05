import type { Image } from "@/shared/api/image";

/** A file shown in a picker: either picked on this device or already on the server. */
export interface MediaItem {
  /** Stable key of the item; the picker reports changes of the item with it. */
  id: string;
  name: string;
  /** URL of the file as it was uploaded, for an image on the server. */
  original?: string;
  /** In bytes. */
  size: number;
  /** A picked file, or the files of an image on the server in every width and format. */
  source: File | Image["sources"];
}

/** An image stored on the server, as an item of a picker. */
export function imageToMediaItem({
  fileName,
  fileSize,
  original,
  sources,
  version,
}: Image): MediaItem {
  return { id: version, name: fileName, original, size: fileSize, source: sources };
}
