import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { sitePagesQuery } from "@/entities/site-page";
import {
  useDeletePageHero,
  useUploadPageHero,
} from "@/features/edit-page-heroes/model/pageHeroMutations";

import { csrfHandler, noContent, problem, uploadsHandler } from "../../../support/handlers";
import { apiImage, imageFile } from "../../../support/images";
import { recordRequests, server } from "../../../support/server";

const home = { label: "Главная", page: "home" } as const;

function sitePages(homeHero: ReturnType<typeof apiImage> | null) {
  return {
    about: { hero: null },
    contacts: { hero: null },
    gallery: { hero: null },
    home: { hero: homeHero },
    projects: { hero: null },
  };
}

function setUp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(sitePagesQuery.queryKey, sitePages(apiImage("old.jpg")));

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return {
    deleteHero: renderHook(() => useDeletePageHero(home), { wrapper }).result.current,
    queryClient,
    uploadHero: renderHook(() => useUploadPageHero(home), { wrapper }).result.current,
  };
}

beforeEach(() => {
  server.use(
    csrfHandler,
    uploadsHandler,
    mswHttp.put("/api/pages/home/hero", () => HttpResponse.json({ hero: apiImage("new.jpg") })),
    mswHttp.delete("/api/pages/home/hero", () => noContent()),
  );
});

describe("useUploadPageHero", () => {
  it("puts the uploaded hero into the pages without loading them again", async () => {
    const { queryClient, uploadHero } = setUp();
    const requests = recordRequests();

    await uploadHero.mutateAsync(imageFile());

    expect(requests).toEqual([
      "GET /api/auth/csrf",
      "POST /api/uploads",
      "PUT /api/pages/home/hero",
    ]);
    expect(queryClient.getQueryData(sitePagesQuery.queryKey)).toEqual(
      sitePages(apiImage("new.jpg")),
    );
  });

  // The page observes the pages, so invalidating them loads them again.
  it("invalidates the pages after a failure, as the hero may have changed anyway", async () => {
    server.use(mswHttp.put("/api/pages/home/hero", () => problem(502)));
    const { queryClient, uploadHero } = setUp();

    await expect(uploadHero.mutateAsync(imageFile())).rejects.toThrow();

    expect(queryClient.getQueryState(sitePagesQuery.queryKey)?.isInvalidated).toBe(true);
  });
});

describe("useDeletePageHero", () => {
  it("removes the hero from the pages without loading them again", async () => {
    const { deleteHero, queryClient } = setUp();
    const requests = recordRequests();

    await deleteHero.mutateAsync();

    expect(requests).toEqual(["GET /api/auth/csrf", "DELETE /api/pages/home/hero"]);
    expect(queryClient.getQueryData(sitePagesQuery.queryKey)).toEqual(sitePages(null));
  });

  it("invalidates the pages after a failure, as the hero may be deleted anyway", async () => {
    server.use(mswHttp.delete("/api/pages/home/hero", () => problem(502)));
    const { deleteHero, queryClient } = setUp();

    await expect(deleteHero.mutateAsync()).rejects.toThrow();

    expect(queryClient.getQueryState(sitePagesQuery.queryKey)?.isInvalidated).toBe(true);
  });
});
