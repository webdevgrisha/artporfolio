/**
 * A text as a part of an address, such as «Dragonfly & Co.» as `dragonfly-co`: Latin letters
 * without their accents, and digits, joined by hyphens. Empty for a text with none of those, such
 * as one in Cyrillic or Chinese: a transliteration of each script would be guessed, not standard.
 */
export function slug(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
}
