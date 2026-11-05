import clsx from "clsx";

import type { Image } from "@/shared/api/image";
import { MediaImage } from "./MediaImage";

import styles from "./PhotoThumbnail.module.css";

interface PhotoThumbnailProps {
  className?: string;
  /** None keeps the place of the photo empty, such as for a project without photos. */
  image: Image | undefined;
}

/**
 * The photo of an item in a row of a list or a table, cropped to fill its place. It loads once its
 * row comes near the screen, so a long table does not load every photo at once.
 */
export function PhotoThumbnail({ className, image }: PhotoThumbnailProps) {
  return image ? (
    <MediaImage
      className={clsx(styles.root, className)}
      loading="lazy"
      sizes="4rem"
      source={image.sources}
    />
  ) : (
    <span className={clsx(styles.root, className)} />
  );
}
