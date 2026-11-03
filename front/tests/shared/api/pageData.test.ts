import { QueryObserver } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchFresh, loadPageData } from "@/shared/api/pageData";
import { queryClient } from "@/shared/api/queryClient";

const queryKey = ["page-data-test"];

afterEach(() => {
  queryClient.removeQueries({ queryKey });
});

describe("fetchFresh", () => {
  it("loads the data again although it is cached", async () => {
    queryClient.setQueryData(queryKey, "cached");
    const queryFn = vi.fn(() => Promise.resolve("fresh"));

    await expect(fetchFresh({ queryFn, queryKey })).resolves.toBe("fresh");
    expect(queryFn).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(queryKey)).toBe("fresh");
  });

  it("loads again when a component that read the query unmounts during the request", async () => {
    // Reads the signal, as the requests of the API do, so leaving the query cancels the request.
    const queryFn = vi.fn(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise<string>((resolve) => {
          const timer = setTimeout(() => resolve("fresh"), 10);
          signal.addEventListener("abort", () => clearTimeout(timer));
        }),
    );

    const loading = fetchFresh({ queryFn, queryKey });
    const unsubscribe = new QueryObserver(queryClient, { enabled: false, queryKey }).subscribe(
      () => undefined,
    );
    unsubscribe();

    await expect(loading).resolves.toBe("fresh");
    expect(queryFn).toHaveBeenCalledTimes(2);
  });
});

describe("loadPageData", () => {
  it("is loaded once every load is done", async () => {
    let finishSecond = () => {};
    const second = new Promise<void>((resolve) => {
      finishSecond = resolve;
    });
    const loaded = vi.fn();

    const { loading } = loadPageData(Promise.resolve("first"), second);
    void loading.then(loaded);

    await Promise.resolve();
    expect(loaded).not.toHaveBeenCalled();

    finishSecond();
    await loading;
    expect(loaded).toHaveBeenCalledOnce();
  });

  it("fails as a load does, for the page to show its error", async () => {
    const error = new Error("No connection");

    await expect(loadPageData(Promise.reject(error)).loading).rejects.toBe(error);
  });

  it("leaves no unhandled rejection when the page is left before its data arrives", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);

    loadPageData(Promise.reject(new Error("No connection")));
    // An unhandled rejection is reported once the microtasks have run.
    await new Promise((resolve) => setTimeout(resolve, 0));

    process.off("unhandledRejection", unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });
});
