import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { aboutQuery } from "@/entities/about";
import {
  saveProcessPhotosFeedback,
  useSaveProcessPhotos,
} from "@/features/edit-about/model/useSaveProcessPhotos";

import { csrfHandler, problem } from "../../../support/handlers";
import { apiProcessPhoto } from "../../../support/images";
import { server } from "../../../support/server";

const a = apiProcessPhoto("a");
const b = apiProcessPhoto("b");

function setUp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(aboutQuery.queryKey, { photo: null, processPhotos: [a, b], text: null });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return {
    queryClient,
    saveProcessPhotos: renderHook(useSaveProcessPhotos, { wrapper }).result.current,
  };
}

/** Deletes `a`, whose request fails with `status`. */
async function deleteA(status: number) {
  server.use(mswHttp.delete("/api/about/process-photos/a", () => problem(status)));
  const { queryClient, saveProcessPhotos } = setUp();

  const error = await saveProcessPhotos
    .mutateAsync({
      changes: { deleted: [a], isReordered: false, steps: [{ photo: b, type: "keep" }] },
      onRowSaved: () => {},
    })
    .catch((rejection: unknown) => rejection);

  return { error, queryClient };
}

beforeEach(() => {
  server.use(csrfHandler);
});

describe("useSaveProcessPhotos", () => {
  it("loads the About page again after a failed save: the server may have changed anyway", async () => {
    // The server deletes the photo, but its response is lost on the way.
    const { queryClient } = await deleteA(502);

    expect(queryClient.getQueryState(aboutQuery.queryKey)?.isInvalidated).toBe(true);
  });

  it("names the photo whose request failed", async () => {
    const { error } = await deleteA(404);

    expect(saveProcessPhotosFeedback.getErrorMessage(error)).toBe(
      "Фото «a.jpg» уже удалено. Обновите страницу",
    );
  });
});
