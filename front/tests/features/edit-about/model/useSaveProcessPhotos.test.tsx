import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { useSaveProcessPhotos } from "@/features/edit-about/model/useSaveProcessPhotos";

import { csrfHandler, problem } from "../../../support/handlers";
import { apiProcessPhoto } from "../../../support/images";
import { server } from "../../../support/server";

const a = apiProcessPhoto("a");
const b = apiProcessPhoto("b");

function renderSaveProcessPhotos() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return renderHook(useSaveProcessPhotos, { wrapper }).result.current;
}

beforeEach(() => {
  // The server deletes the photo, but its response is lost on the way.
  server.use(
    csrfHandler,
    mswHttp.delete("/api/about/process-photos/a", () => problem(502)),
  );
});

describe("useSaveProcessPhotos", () => {
  it("takes the photos the server has after the save, not the ones the requests suggest", async () => {
    server.use(
      mswHttp.get("/api/about", () =>
        HttpResponse.json({ photo: null, processPhotos: [b], text: null }),
      ),
    );

    const result = await renderSaveProcessPhotos().mutateAsync({
      changes: { deletedIds: ["a"], steps: [{ id: "b", type: "keep" }] },
      savedProcessPhotos: [a, b],
    });

    expect(result.photos).toEqual([b]);
    expect(result.rows).toEqual([{ alt: "Этап b", file: null, photoId: "b", status: "saved" }]);
  });

  it("keeps the photos the requests suggest when the page cannot be loaded again", async () => {
    server.use(mswHttp.get("/api/about", () => HttpResponse.error()));

    const result = await renderSaveProcessPhotos().mutateAsync({
      changes: { deletedIds: ["a"], steps: [{ id: "b", type: "keep" }] },
      savedProcessPhotos: [a, b],
    });

    expect(result.photos).toEqual([a, b]);
  });
});
