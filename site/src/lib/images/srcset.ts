import type { ImageFile } from "@/lib/api/image";

/** The files of an image as a `srcset`, for the browser to pick the width it needs. */
export function srcset(files: readonly ImageFile[]): string {
  return files.map(({ url, width }) => `${url} ${width}w`).join(", ");
}
