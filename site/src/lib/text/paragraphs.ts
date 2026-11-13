/**
 * The paragraphs of a text of the admin, which separates them by an empty line, as its hint asks.
 * A single line break stays within its paragraph, where the page keeps it (`white-space:
 * pre-line`), as the artist may break a line on purpose.
 */
export function paragraphs(text: string): string[] {
  return text
    .replaceAll("\r\n", "\n")
    .split(/\n[^\S\n]*\n\s*/u)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
}
