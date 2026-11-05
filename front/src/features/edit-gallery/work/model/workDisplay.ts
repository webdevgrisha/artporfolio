import type { WorkFormat, WorkSize } from "@/entities/gallery";

/** The text of a side in a field, with the comma usual in Russian: «29,7». */
export function formatSide(side: number): string {
  return String(side).replace(".", ",");
}

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

/** The size as the admin reads it: «29,7 × 42 см», the width first. */
export function formatWorkSize({ height, width }: WorkSize): string {
  return `${formatSide(width)} × ${formatSide(height)} см`;
}

const monthNames = new Intl.DateTimeFormat("ru", { month: "long" });

/** The name of the month on its own, as in a list: «март» for 3. */
function monthName(month: number): string {
  return monthNames.format(new Date(2000, month - 1, 1));
}

/** The months to choose from, «Январь» to «Декабрь». */
export const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const name = monthName(index + 1);

  return { label: name.charAt(0).toUpperCase() + name.slice(1), value: String(index + 1) };
});

/** When the work was finished, as the admin reads it: «март 2024». */
export function formatWorkDate({ month, year }: { month: number; year: number }): string {
  return `${monthName(month)} ${String(year)}`;
}
