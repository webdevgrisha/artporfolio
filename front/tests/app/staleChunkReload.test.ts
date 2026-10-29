import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { reloadOnStaleChunks } from "@/app/staleChunkReload";

/** Fires the event Vite sends when a chunk of the app fails to load; true if it was handled. */
function failChunkImport(): boolean {
  const event = new Event("vite:preloadError", { cancelable: true });
  window.dispatchEvent(event);

  return event.defaultPrevented;
}

beforeAll(() => {
  reloadOnStaleChunks();
});

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.spyOn(window.location, "reload").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("reloadOnStaleChunks", () => {
  it("reloads the page to get the new build", () => {
    expect(failChunkImport()).toBe(true);
    expect(window.location.reload).toHaveBeenCalledOnce();
  });

  it("does not reload again right after a reload: the build is not stale", () => {
    failChunkImport();
    vi.advanceTimersByTime(9_000);

    expect(failChunkImport()).toBe(false);
    expect(window.location.reload).toHaveBeenCalledOnce();
  });

  it("reloads again later, after the next deploy", () => {
    failChunkImport();
    vi.advanceTimersByTime(10_000);

    expect(failChunkImport()).toBe(true);
    expect(window.location.reload).toHaveBeenCalledTimes(2);
  });

  it("does not reload where the reload cannot be remembered, so the page never loops", () => {
    vi.spyOn(sessionStorage, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(failChunkImport()).toBe(false);
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
