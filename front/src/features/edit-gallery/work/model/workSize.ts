import type { WorkSize } from "@/entities/gallery";

/** The text of a side in a field, with the comma usual in Russian: «29,7». */
export function formatSide(side: number): string {
  return String(side).replace(".", ",");
}

/** The size as the admin reads it: «29,7 × 42 см», the width first. */
export function formatWorkSize({ height, width }: WorkSize): string {
  return `${formatSide(width)} × ${formatSide(height)} см`;
}
