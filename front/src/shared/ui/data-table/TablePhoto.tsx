import type { Image } from "@/shared/api/image";
import { imageToMediaItem, MediaImage } from "@/shared/ui/media-preview";

import styles from "./TablePhoto.module.css";

interface TablePhotoProps {
  /** None keeps the place of the photo empty, such as for a project without photos. */
  image: Image | undefined;
}

/** The photo of an item in its row, cropped to fill its place. */
export function TablePhoto({ image }: TablePhotoProps) {
  return image ? (
    <MediaImage className={styles.root} source={imageToMediaItem(image).source} />
  ) : (
    <span className={styles.root} />
  );
}
