import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { processPhotosQuery } from "@/entities/about";
import {
  saveProcessPhotosFeedback,
  useSaveProcessPhotos,
} from "@/features/edit-about/model/useSaveProcessPhotos";
import { HttpError } from "@/shared/api/httpError";
import { UploadError } from "@/shared/api/upload";

import { csrfHandler, problem } from "../../../support/handlers";
import { apiProcessPhoto } from "../../../support/images";
import { server } from "../../../support/server";

const a = apiProcessPhoto("a");
const b = apiProcessPhoto("b");
const etag = '"list-tag"';

function setUp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(processPhotosQuery.queryKey, { data: [a, b], etag });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return {
    queryClient,
    saveProcessPhotos: renderHook(useSaveProcessPhotos, { wrapper }).result.current,
  };
}

/** Keeps only `b`, as the list `etag` names. */
function keepB() {
  return { etag, rows: [{ alt: b.alt, file: null, photo: b, status: "saved" as const }] };
}

beforeEach(() => {
  server.use(csrfHandler);
});

describe("useSaveProcessPhotos", () => {
  it("puts the saved list into the cache without loading it again", async () => {
    server.use(
      mswHttp.put("/api/about/process-photos", () =>
        HttpResponse.json({ processPhotos: [b] }, { headers: { ETag: '"new-tag"' } }),
      ),
    );
    const { queryClient, saveProcessPhotos } = setUp();

    await saveProcessPhotos.mutateAsync(keepB());

    expect(queryClient.getQueryData(processPhotosQuery.queryKey)).toEqual({
      data: [b],
      etag: '"new-tag"',
    });
  });

  it("keeps the cached list after a failed save, which changed nothing", async () => {
    server.use(mswHttp.put("/api/about/process-photos", () => problem(412)));
    const { queryClient, saveProcessPhotos } = setUp();

    await expect(saveProcessPhotos.mutateAsync(keepB())).rejects.toBeInstanceOf(HttpError);

    expect(queryClient.getQueryData(processPhotosQuery.queryKey)).toEqual({
      data: [a, b],
      etag,
    });
  });
});

describe("saveProcessPhotosFeedback", () => {
  it.each([
    [
      new HttpError(412),
      "Фото уже изменили в другой вкладке. Обновите страницу и внесите изменения заново",
    ],
    [
      new UploadError("etude.png", new HttpError(400)),
      "Сервер не принял фото «etude.png». Попробуйте другой файл",
    ],
  ])("explains %o", (error, message) => {
    expect(saveProcessPhotosFeedback.getErrorMessage(error)).toBe(message);
  });
});
