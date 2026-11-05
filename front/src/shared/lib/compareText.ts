const collator = new Intl.Collator("ru", { sensitivity: "base" });

/** The order of two texts for a Russian reader, whatever their case. */
export function compareText(a: string, b: string): number {
  return collator.compare(a, b);
}
