/** The time zone furthest ahead of UTC, Kiribati's UTC+14, in milliseconds. */
const latestOffsetMilliseconds = 14 * 60 * 60 * 1_000;

/**
 * Today's year and month where they have come first. The server runs in UTC, so a date checked
 * against its own clock would refuse the new month for the first hours of it east of Greenwich;
 * against this, no time zone is ever ahead of the server.
 */
export function latestToday(): { year: number; month: number } {
  const date = new Date(Date.now() + latestOffsetMilliseconds);

  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}
