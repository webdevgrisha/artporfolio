import type { SyntheticEvent } from "react";

import type { Image } from "@/shared/api/image";
import { useObjectUrl } from "@/shared/lib/useObjectUrl";

import styles from "./MediaImage.module.css";

type ImageSources = Image["sources"];

interface MediaImageProps {
  className?: string;
  /** "lazy" for an image that may be far down a list: it loads once it comes near the screen. */
  loading?: "eager" | "lazy";
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  /**
   * The width the image takes on the screen, such as "4rem": the browser loads the smallest
   * width of an image on the server that fills it. Without it the largest width is loaded.
   */
  sizes?: string;
  source: File | ImageSources;
}

/** The files are ordered by width. */
function largest(files: ImageSources["webp"]): ImageSources["webp"][0] {
  return files.at(-1) ?? files[0];
}

function toSrcSet(files: ImageSources["webp"]): string {
  return files.map(({ url, width }) => `${url} ${String(width)}w`).join(", ");
}

/**
 * An image of a picked file or of an image on the server, which the browser gets as AVIF or, when
 * it cannot show that, as WebP. Decorative: the file name is always shown with it.
 */
export function MediaImage({ className, loading, onLoad, sizes, source }: MediaImageProps) {
  const objectUrl = useObjectUrl(source instanceof File ? source : undefined);

  if (source instanceof File) {
    return objectUrl ? (
      <img
        className={className}
        src={objectUrl}
        alt=""
        loading={loading}
        decoding="async"
        onLoad={onLoad}
      />
    ) : null;
  }

  // Without `sizes` a plain URL, not a width descriptor: with one the browser would scale the
  // image to the width of the screen, and its natural size would not be that of the file.
  const avif = sizes ? toSrcSet(source.avif) : largest(source.avif).url;
  const webp = sizes ? toSrcSet(source.webp) : largest(source.webp).url;

  return (
    <picture className={styles.picture}>
      <source type="image/avif" srcSet={avif} sizes={sizes} />
      <img
        className={className}
        src={largest(source.webp).url}
        srcSet={webp}
        sizes={sizes}
        alt=""
        loading={loading}
        decoding="async"
        onLoad={onLoad}
      />
    </picture>
  );
}
