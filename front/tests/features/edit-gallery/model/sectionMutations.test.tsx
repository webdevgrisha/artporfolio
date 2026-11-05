import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import type { GallerySection } from "@/entities/gallery";
import { useCreateSection } from "@/features/edit-gallery/model/sectionMutations";

import { csrfHandler, problem } from "../../../support/handlers";
import { recordRequests, server } from "../../../support/server";

const id = "11111111-1111-4111-8111-111111111111";
const path = `/api/gallery-sections/${id}`;
const values = {
  subsections: [{ id: "22222222-2222-4222-8222-222222222222", title: "Театральные" }],
  title: "Постеры",
};
const savedEtag = '"saved"';

function apiSection(title: string): GallerySection {
  return { id, subsections: values.subsections, title };
}

function setUp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return renderHook(() => useCreateSection(), { wrapper }).result.current;
}

/** The conditional headers of each PUT of the section, in order. */
function recordPreconditions(): { ifMatch: string | null; ifNoneMatch: string | null }[] {
  const headers: { ifMatch: string | null; ifNoneMatch: string | null }[] = [];
  server.events.on("request:start", ({ request }) => {
    if (request.method === "PUT" && new URL(request.url).pathname === path) {
      headers.push({
        ifMatch: request.headers.get("If-Match"),
        ifNoneMatch: request.headers.get("If-None-Match"),
      });
    }
  });
  return headers;
}

beforeEach(() => {
  server.use(csrfHandler);
});

describe("useCreateSection", () => {
  it("creates the section the form named, only if there is none yet", async () => {
    server.use(
      mswHttp.put(path, () =>
        HttpResponse.json(apiSection("Постеры"), { headers: { ETag: savedEtag }, status: 201 }),
      ),
    );
    const createSection = setUp();
    const preconditions = recordPreconditions();

    const section = await createSection.mutateAsync({ id, values });

    expect(section.title).toBe("Постеры");
    expect(preconditions).toEqual([{ ifMatch: null, ifNoneMatch: "*" }]);
  });

  it("never overwrites the section an earlier try created, which may have changed since", async () => {
    server.use(mswHttp.put(path, () => problem(412)));
    const createSection = setUp();
    const requests = recordRequests();

    await expect(createSection.mutateAsync({ id, values })).rejects.toMatchObject({ status: 412 });
    expect(requests.filter((request) => request.endsWith(path))).toEqual([`PUT ${path}`]);
  });

  it("does not retry a title another section has", async () => {
    server.use(mswHttp.put(path, () => problem(409)));
    const createSection = setUp();
    const requests = recordRequests();

    await expect(createSection.mutateAsync({ id, values })).rejects.toMatchObject({ status: 409 });
    expect(requests).toEqual(["GET /api/auth/csrf", `PUT ${path}`]);
  });
});
