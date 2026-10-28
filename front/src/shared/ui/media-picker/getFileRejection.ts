import { formatFileSize } from "@/shared/lib/formatFileSize";

interface FileRules {
  accept: readonly string[];
  acceptLabel: string;
  maxFileSize: number;
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

/** Why the file cannot be picked, or `undefined` if it can. */
export function getFileRejection(
  file: File,
  { accept, acceptLabel, maxFileSize }: FileRules,
): string | undefined {
  if (!isAccepted(file, accept)) {
    return `Файл «${file.name}» не подходит. Можно выбрать ${acceptLabel}`;
  }

  if (file.size > maxFileSize) {
    return `Файл «${file.name}» больше ${formatFileSize(maxFileSize)}`;
  }

  return undefined;
}
