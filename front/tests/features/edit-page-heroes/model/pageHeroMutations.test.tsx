import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { pageHeroQuery } from "@/entities/site-page";
import {
  useDeletePageHero,
  useUploadPageHero,
} from "@/features/edit-page-heroes/model/pageHeroMutations";

import { csrfHandler, noContent, problem, uploadsHandler } from "../../../support/handlers";
import { apiImage, imageFile } from "../../../support/images";
import { recordRequests, server } from "../../../support/server";

const home = { label: "Главная", page: "home" } as const;
const { queryKey } = pageHeroQuery("home");

/** The ETag of the hero the card shows, and of the hero each change saves. */
const etag = '"read"';
const savedEtag = '"saved"';

function setUp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(queryKey, { data: apiImage("old.jpg"), etag });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return {
    deleteHero: renderHook(() => useDeletePageHero(home), { wrapper }).result.current,
    queryClient,
    uploadHero: renderHook(() => useUploadPageHero(home), { wrapper }).result.current,
  };
}

/** The If-Match header of each change of the home hero, in order. */
function recordIfMatch(): (string | null)[] {
  const headers: (string | null)[] = [];
  server.events.on("request:start", ({ request }) => {
    if (request.method !== "GET" && new URL(request.url).pathname === "/api/pages/home/hero") {
      headers.push(request.headers.get("If-Match"));
    }
  });
  return headers;
}

beforeEach(() => {
  server.use(
    csrfHandler,
    uploadsHandler,
    mswHttp.get("/api/pages/home/hero", () =>
      HttpResponse.json({ hero: null }, { headers: { ETag: savedEtag } }),
    ),
    mswHttp.put("/api/pages/home/hero", () =>
      HttpResponse.json({ hero: apiImage("new.jpg") }, { headers: { ETag: savedEtag } }),
    ),
    mswHttp.delete("/api/pages/home/hero", () => noContent({ ETag: savedEtag })),
  );
});

describe("useUploadPageHero", () => {
  it("puts the uploaded hero with its ETag into the cache without loading it again", async () => {
    const { queryClient, uploadHero } = setUp();
    const requests = recordRequests();
    const ifMatch = recordIfMatch();

    await uploadHero.mutateAsync({ etag, file: imageFile() });

    expect(requests).toEqual([
      "GET /api/auth/csrf",
      "POST /api/uploads",
      "PUT /api/pages/home/hero",
    ]);
    expect(ifMatch).toEqual([etag]);
    expect(queryClient.getQueryData(queryKey)).toEqual({
      data: apiImage("new.jpg"),
      etag: savedEtag,
    });
  });

  // The card observes its hero, so invalidating it loads it again.
  it("invalidates the hero after a failure, as it may have changed anyway", async () => {
    server.use(mswHttp.put("/api/pages/home/hero", () => problem(412)));
    const { queryClient, uploadHero } = setUp();

    await expect(uploadHero.mutateAsync({ etag, file: imageFile() })).rejects.toThrow();

    expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
  });
});

describe("useDeletePageHero", () => {
  it("puts the empty hero with its ETag into the cache without loading it again", async () => {
    const { deleteHero, queryClient } = setUp();
    const requests = recordRequests();
    const ifMatch = recordIfMatch();

    await deleteHero.mutateAsync({ etag });

    expect(requests).toEqual(["GET /api/auth/csrf", "DELETE /api/pages/home/hero"]);
    expect(ifMatch).toEqual([etag]);
    expect(queryClient.getQueryData(queryKey)).toEqual({ data: null, etag: savedEtag });
  });

  it("invalidates the hero after a failure, as it may be deleted anyway", async () => {
    server.use(mswHttp.delete("/api/pages/home/hero", () => problem(502)));
    const { deleteHero, queryClient } = setUp();

    await expect(deleteHero.mutateAsync({ etag })).rejects.toThrow();

    expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
  });
});
