const reloadedAtKey = "stale-chunk-reload-at";
/** A failure this soon after the reload is not a stale tab, so it is not retried. */
const retryWindowMs = 10_000;

function readReloadedAt(): number | undefined {
  try {
    return Number(sessionStorage.getItem(reloadedAtKey)) || undefined;
  } catch {
    return undefined;
  }
}

/** Remembers the reload; returns false where storage is blocked, so the page never loops. */
function saveReloadedAt(time: number): boolean {
  try {
    sessionStorage.setItem(reloadedAtKey, String(time));
    return true;
  } catch {
    return false;
  }
}

/**
 * After a deploy, a tab opened earlier still asks for the chunks of the previous build, which no
 * longer exist. Vite reports the failed import as `vite:preloadError`; one reload fetches the new
 * build. Any other failure reaches the route's error boundary as usual.
 */
export function reloadOnStaleChunks() {
  window.addEventListener("vite:preloadError", (event) => {
    const now = Date.now();
    const reloadedAt = readReloadedAt();

    if (reloadedAt !== undefined && now - reloadedAt < retryWindowMs) return;
    if (!saveReloadedAt(now)) return;

    event.preventDefault();
    window.location.reload();
  });
}
