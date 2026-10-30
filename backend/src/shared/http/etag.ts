import { createHash } from "node:crypto";

/** The value with the keys of every object sorted, so equal data always serializes the same. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonical);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, entry]) => [key, canonical(entry)]),
    );
  }

  return value;
}

/** A strong entity tag (RFC 9110 §8.8.3) of the data: equal data always gets the same tag. */
export function entityTag(data: unknown): string {
  const hash = createHash("sha256")
    .update(JSON.stringify(canonical(data)))
    .digest("base64url");

  return `"${hash}"`;
}

/**
 * Whether a change with this If-Match header (RFC 9110 §13.1.1) may replace the representation
 * with the `current` tag. The comparison is strong: a weak tag never matches.
 */
export function matchesIfMatch(header: string, current: string): boolean {
  const value = header.trim();

  return value === "*" || value.split(",").some((tag) => tag.trim() === current);
}
