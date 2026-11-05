import { QueryObserver } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadCached, loadFresh } from "@/shared/api/pageData";
import { queryClient } from "@/shared/api/queryClient";

const queryKey = ["page-data-test"];

const neverLoads = () => new Promise<string>(() => undefined);

afterEach(() => {
  vi.useRealTimers();
  queryClient.removeQueries({ queryKey });
});

describe("loadFresh", () => {
  it("loads the data again although it is cached", async () => {
    queryClient.setQueryData(queryKey, "cached");
    const queryFn = vi.fn(() => Promise.resolve("fresh"));

    await (await loadFresh({ queryFn, queryKey })).loading;

    expect(queryFn).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(queryKey)).toBe("fresh");
  });

  it("finishes the request when a component that read the query unmounts during it", async () => {
    const queryFn = vi.fn(() => Promise.resolve("fresh"));

    const page = loadFresh({ queryFn, queryKey });
    const unsubscribe = new QueryObserver(queryClient, { enabled: false, queryKey }).subscribe(
      () => undefined,
    );
    unsubscribe();

    await (await page).loading;
    expect(queryFn).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(queryKey)).toBe("fresh");
  });

  it("is loaded once every query is done", async () => {
    let finishSecond = () => {};
    const second = new Promise<string>((resolve) => {
      finishSecond = () => resolve("second");
    });
    const loaded = vi.fn();

    const page = loadFresh(
      { queryFn: () => Promise.resolve("first"), queryKey },
      { queryFn: () => second, queryKey: [...queryKey, "second"] },
    );
    void page.then(loaded);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(loaded).not.toHaveBeenCalled();

    finishSecond();
    const { isReady } = await page;
    expect(isReady).toBe(true);
    expect(loaded).toHaveBeenCalledOnce();
  });

  it("opens the page without its data after a moment, for the skeleton to show", async () => {
    vi.useFakeTimers();

    const page = loadFresh({ queryFn: neverLoads, queryKey });
    await vi.advanceTimersByTimeAsync(1000);

    expect((await page).isReady).toBe(false);
  });

  it("fails as a query does, for the page to show its error", async () => {
    const error = new Error("No connection");

    const { isReady, loading } = await loadFresh({
      queryFn: () => Promise.reject(error),
      queryKey,
      retry: false,
    });

    expect(isReady).toBe(false);
    await expect(loading).rejects.toBe(error);
  });

  it("leaves no unhandled rejection when the page is left before its data arrives", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);

    void loadFresh({
      queryFn: () => Promise.reject(new Error("No connection")),
      queryKey,
      retry: false,
    });
    // An unhandled rejection is reported once the microtasks have run.
    await new Promise((resolve) => setTimeout(resolve, 0));

    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});

describe("loadCached", () => {
  it("opens the page on the cache at once and still refreshes it", async () => {
    queryClient.setQueryData(queryKey, "cached");

    const { isReady } = await loadCached({ queryFn: neverLoads, queryKey });

    expect(isReady).toBe(true);
    expect(queryClient.getQueryData(queryKey)).toBe("cached");
  });

  it("replaces the cache with the fresh data", async () => {
    queryClient.setQueryData(queryKey, "cached");

    const { loading } = await loadCached({ queryFn: () => Promise.resolve("fresh"), queryKey });

    await loading;
    expect(queryClient.getQueryData(queryKey)).toBe("fresh");
  });

  it("waits for data that is not cached yet", async () => {
    vi.useFakeTimers();

    const page = loadCached({ queryFn: neverLoads, queryKey });
    await vi.advanceTimersByTimeAsync(1000);

    expect((await page).isReady).toBe(false);
  });

  it("waits for data a change has outdated, so the old values never show", async () => {
    queryClient.setQueryData(queryKey, "cached");
    await queryClient.invalidateQueries({ queryKey, refetchType: "none" });
    vi.useFakeTimers();

    const page = loadCached({ queryFn: neverLoads, queryKey });
    await vi.advanceTimersByTimeAsync(1000);

    expect((await page).isReady).toBe(false);
  });

  it("waits while any of the queries of the page is missing", async () => {
    queryClient.setQueryData(queryKey, "cached");
    vi.useFakeTimers();

    const page = loadCached(
      { queryFn: neverLoads, queryKey },
      { queryFn: neverLoads, queryKey: [...queryKey, "second"] },
    );
    await vi.advanceTimersByTimeAsync(1000);

    expect((await page).isReady).toBe(false);
  });
});
