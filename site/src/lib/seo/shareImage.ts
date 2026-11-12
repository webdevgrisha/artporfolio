import type { Image } from "@/lib/api/image";

/** The width a link card shows a picture at: Facebook, Telegram and others advise 1200px. */
const cardWidth = 1200;

export interface ShareImage {
  height: number;
  url: string;
  width: number;
}

/**
 * The file of `image` a link card shows, as `og:image`: the narrowest at least as wide as a card,
 * else the widest there is. WebP, as cards do not read AVIF. Its height follows from the shape of
 * the image.
 */
export function shareImage(image: Image): ShareImage {
  const files = image.sources.webp;
  const file =
    files.find(({ width }) => width >= cardWidth) ??
    files.reduce((widest, next) => (next.width > widest.width ? next : widest));

  return {
    height: Math.round((file.width * image.height) / image.width),
    url: file.url,
    width: file.width,
  };
}
