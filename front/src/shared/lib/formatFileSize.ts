const units = ["Б", "КБ", "МБ", "ГБ"] as const;
const numberFormat = new Intl.NumberFormat("ru", { maximumFractionDigits: 1 });

/** A file size for people, in binary units as file managers show it: `466 КБ`, `12,4 МБ`. */
export function formatFileSize(bytes: number): string {
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${numberFormat.format(value)} ${units[unitIndex]}`;
}
