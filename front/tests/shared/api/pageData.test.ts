import { QueryObserver } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadCached, loadFresh } from "@/shared/api/pageData";
import { queryClient } from "@/shared/api/queryClient";

const queryKey = ["page-data-test"];

afterEach(() => {
  queryClient.removeQueries({ queryKey });
});

describe("loadFresh", () => {
  it("loads the data again although it is cached", async () => {
    queryClient.setQueryData(queryKey, "cached");
    const queryFn = vi.fn(() => Promise.resolve("fresh"));

    await loadFresh({ queryFn, queryKey }).loading;

    expect(queryFn).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(queryKey)).toBe("fresh");
  });

  it("finishes the request when a component that read the query unmounts during it", async () => {
    const queryFn = vi.fn(() => Promise.resolve("fresh"));

    const { loading } = loadFresh({ queryFn, queryKey });
    const unsubscribe = new QueryObserver(queryClient, { enabled: false, queryKey }).subscribe(
      () => undefined,
    );
    unsubscribe();

    await loading;
    expect(queryFn).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(queryKey)).toBe("fresh");
  });

  it("is loaded once every query is done", async () => {
    let finishSecond = () => {};
    const second = new Promise<string>((resolve) => {
      finishSecond = () => resolve("second");
    });
    const loaded = vi.fn();

    const { loading } = loadFresh(
      { queryFn: () => Promise.resolve("first"), queryKey },
      { queryFn: () => second, queryKey: [...queryKey, "second"] },
    );
    void loading.then(loaded);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(loaded).not.toHaveBeenCalled();

    finishSecond();
    await loading;
    expect(loaded).toHaveBeenCalledOnce();
  });

  it("fails as a query does, for the page to show its error", async () => {
    const error = new Error("No connection");

    await expect(
      loadFresh({ queryFn: () => Promise.reject(error), queryKey, retry: false }).loading,
    ).rejects.toBe(error);
  });

  it("leaves no unhandled rejection when the page is left before its data arrives", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);

    loadFresh({
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
  it("opens the page on the cache and still refreshes it", async () => {
    queryClient.setQueryData(queryKey, "cached");

    const { isCached, loading } = loadCached({
      queryFn: () => Promise.resolve("fresh"),
      queryKey,
    });

    expect(isCached).toBe(true);
    await loading;
    expect(queryClient.getQueryData(queryKey)).toBe("fresh");
  });

  it("waits for data that is not cached yet", () => {
    const { isCached } = loadCached({ queryFn: () => Promise.resolve("fresh"), queryKey });

    expect(isCached).toBe(false);
  });

  it("waits for data a change has outdated, so the old values never show", async () => {
    queryClient.setQueryData(queryKey, "cached");
    await queryClient.invalidateQueries({ queryKey, refetchType: "none" });

    const { isCached } = loadCached({ queryFn: () => Promise.resolve("fresh"), queryKey });

    expect(isCached).toBe(false);
  });

  it("waits while any of the queries of the page is missing", () => {
    queryClient.setQueryData(queryKey, "cached");
    const queryFn = () => Promise.resolve("fresh");

    const { isCached } = loadCached(
      { queryFn, queryKey },
      { queryFn, queryKey: [...queryKey, "second"] },
    );

    expect(isCached).toBe(false);
  });
});
