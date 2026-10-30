import { createHash } from "node:crypto";

import { PreconditionFailedError } from "#shared/http/errors";

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

/** A representation with the entity tag of the stored data it was made from. */
export interface Tagged<T> {
  data: T;
  etag: string;
}

/**
 * Rejects a change with 412 unless its If-Match header still names the tag of `stored`, the data
 * the change replaces: a change made from an outdated read, for example in another tab, would
 * overwrite what its author has never seen.
 */
export function assertIfMatch(ifMatch: string, stored: unknown): void {
  if (!matchesIfMatch(ifMatch, entityTag(stored))) {
    throw new PreconditionFailedError();
  }
}
