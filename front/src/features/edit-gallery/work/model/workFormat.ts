import type { WorkFormat } from "@/entities/gallery";

/** The formats to choose from, a single work first, as it is the usual one. */
export const workFormatOptions: readonly { label: string; value: WorkFormat }[] = [
  { label: "Одна работа", value: "single" },
  { label: "Диптих", value: "diptych" },
  { label: "Триптих", value: "triptych" },
  { label: "Несколько работ", value: "set" },
];

/** The format as the admin reads it in the table: «Одна работа», «Диптих», «12 шт.». */
export function formatWorkFormat({
  format,
  partCount,
}: {
  format: WorkFormat;
  partCount: number | null;
}): string {
  switch (format) {
    case "single":
      return "Одна работа";
    case "diptych":
      return "Диптих";
    case "triptych":
      return "Триптих";
    case "set":
      return `${String(partCount)} шт.`;
  }
}
