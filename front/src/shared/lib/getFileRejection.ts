import { formatFileSize } from "@/shared/lib/formatFileSize";

/**
 * The smallest image a picker takes, by its width or by its longer side, so a portrait photo is
 * not held to the width of a landscape one.
 */
export interface MinImageSize {
  pixels: number;
  side: "longer" | "width";
}

/** Which files a picker takes, such as `imageUploadRules`. */
export interface FileRules {
  /**
   * Accepted MIME types and, for files whose type the browser does not know, extensions, as in
   * the `accept` attribute: `["image/jpeg", ".jpg"]`.
   */
  accept: readonly string[];
  /** The accepted types for people, e.g. `JPEG или PNG`. */
  acceptLabel: string;
  /** In bytes. */
  maxFileSize: number;
  /** For images: a smaller one would look blurred where it is shown. */
  minImageSize?: MinImageSize;
}

function describeMinImageSize({ pixels, side }: MinImageSize): string {
  return `от ${String(pixels)} px ${side === "width" ? "в ширину" : "по длинной стороне"}`;
}

/** The rules for people, for the hint of a picker: `JPEG или PNG, до 15 МБ, от 1280 px…`. */
export function describeFileRules({ acceptLabel, maxFileSize, minImageSize }: FileRules): string {
  const size = minImageSize ? `, ${describeMinImageSize(minImageSize)}` : "";

  return `${acceptLabel}, до ${formatFileSize(maxFileSize)}${size}`;
}

/**
 * Whether the file matches `accept`, which lists MIME types and extensions like the `accept`
 * attribute. The type decides when the browser knows it; some systems leave it empty, and then
 * the extension does.
 */
function isAccepted(file: File, accept: readonly string[]): boolean {
  if (file.type) return accept.includes(file.type);

  const extensionStart = file.name.lastIndexOf(".");
  return extensionStart > 0 && accept.includes(file.name.slice(extensionStart).toLowerCase());
}

/**
 * The size of the image as it is shown, after its EXIF orientation, or `undefined` when the
 * browser cannot decode it: the server then checks the file and explains what is wrong.
 */
async function readImageSize(file: File): Promise<{ height: number; width: number } | undefined> {
  try {
    const bitmap = await createImageBitmap(file);
    const { height, width } = bitmap;
    bitmap.close();

    return { height, width };
  } catch {
    return undefined;
  }
}

/** Why the image is too small for `minImageSize`, or `undefined` if it is large enough. */
async function getImageSizeRejection(
  file: File,
  minImageSize: MinImageSize,
): Promise<string | undefined> {
  const size = await readImageSize(file);
  if (!size) return undefined;

  const { height, width } = size;
  const measured = minImageSize.side === "width" ? width : Math.max(width, height);
  if (measured >= minImageSize.pixels) return undefined;

  return `Фото «${file.name}» — ${String(width)} × ${String(height)} px, а нужно ${describeMinImageSize(minImageSize)}`;
}

/**
 * Why the file cannot be picked, or `undefined` if it can. The size of an image is read only once
 * the type and the file size pass.
 */
export async function getFileRejection(
  file: File,
  { accept, acceptLabel, maxFileSize, minImageSize }: FileRules,
): Promise<string | undefined> {
  if (!isAccepted(file, accept)) {
    return `Файл «${file.name}» не подходит. Можно выбрать ${acceptLabel}`;
  }

  if (file.size > maxFileSize) {
    return `Файл «${file.name}» больше ${formatFileSize(maxFileSize)}`;
  }

  return minImageSize ? getImageSizeRejection(file, minImageSize) : undefined;
}
