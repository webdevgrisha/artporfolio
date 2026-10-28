import { formatFileSize } from "@/shared/lib/formatFileSize";

interface FileRules {
  accept: readonly string[];
  acceptLabel: string;
  maxFileSize: number;
}

/** Why the file cannot be picked, or `undefined` if it can. */
export function getFileRejection(
  file: File,
  { accept, acceptLabel, maxFileSize }: FileRules,
): string | undefined {
  if (!accept.includes(file.type)) {
    return `Файл «${file.name}» не подходит. Можно выбрать ${acceptLabel}`;
  }

  if (file.size > maxFileSize) {
    return `Файл «${file.name}» больше ${formatFileSize(maxFileSize)}`;
  }

  return undefined;
}
