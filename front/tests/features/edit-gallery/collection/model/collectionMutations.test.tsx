import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import type { GalleryCollection } from "@/entities/gallery";
import { emptyCollectionFormValues } from "@/features/edit-gallery/collection/model/collectionFormSchema";
import {
  useCreateCollection,
  useSaveCollection,
} from "@/features/edit-gallery/collection/model/collectionMutations";
import { targetLanguages } from "@/shared/config/languages";
import { savedImage } from "@/shared/lib/imageFieldValue";

import { csrfHandler, problem, uploadId, uploadsHandler } from "../../../../support/handlers";
import { recordRequests, server } from "../../../../support/server";

const id = "11111111-1111-4111-8111-111111111111";
const path = `/api/gallery/collections/${id}`;
const workId = "22222222-2222-4222-8222-222222222222";
/** The values of the form, with a new file each time: a file once uploaded is not sent again. */
const values = () => ({
  ...emptyCollectionFormValues,
  description: "Серия о животных.",
  photo: new File(["png"], "savanna.png", { type: "image/png" }),
  photoAlt: "Саванна",
  startYear: "2022",
  title: "Саванна",
  workIds: [workId],
});
const savedEtag = '"saved"';

function apiCollection(title: string): GalleryCollection {
  return {
    cover: {
      alt: "Саванна",
      fileName: "savanna.png",
      fileSize: 100,
      height: 640,
      original: "/api/originals/savanna/original.jpeg",
      sources: {
        avif: [{ url: "https://storage.test/savanna/960.avif", width: 960 }],
        webp: [{ url: "https://storage.test/savanna/960.webp", width: 960 }],
      },
      version: "version",
      width: 960,
    },
    translations: {},
    createdAt: "2026-01-15T10:00:00.000Z",
    description: "Серия о животных.",
    endYear: null,
    id,
    startYear: 2022,
    title,
    updatedAt: "2026-01-15T10:00:00.000Z",
    workIds: [workId],
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

interface RecordedPut {
  body: unknown;
  ifMatch: string | null;
  ifNoneMatch: string | null;
}

/** Answers each PUT of the collection with `respond`, and records its body and conditional headers. */
function handlePuts(respond: (put: RecordedPut) => Response) {
  const puts: RecordedPut[] = [];
  server.use(
    mswHttp.put(path, async ({ request }) => {
      const put = {
        body: await request.json(),
        ifMatch: request.headers.get("If-Match"),
        ifNoneMatch: request.headers.get("If-None-Match"),
      };
      puts.push(put);
      return respond(put);
    }),
  );
  return puts;
}

beforeEach(() => {
  server.use(csrfHandler, uploadsHandler);
});

describe("useCreateCollection", () => {
  it("uploads the cover and creates the collection with its works and years", async () => {
    const puts = handlePuts(() =>
      HttpResponse.json(apiCollection("Саванна"), { headers: { ETag: savedEtag }, status: 201 }),
    );
    const createCollection = renderHook(() => useCreateCollection(), { wrapper }).result.current;

    const collection = await createCollection.mutateAsync({
      id,
      values: { ...values(), endYear: "2024" },
    });

    expect(collection.title).toBe("Саванна");
    expect(puts).toEqual([
      {
        body: {
          cover: { alt: "Саванна", uploadId },
          description: "Серия о животных.",
          endYear: 2024,
          startYear: 2022,
          title: "Саванна",
          workIds: [workId],
          translations: Object.fromEntries(
            targetLanguages.map((language) => [
              language,
              { alt: null, description: null, title: null },
            ]),
          ),
        },
        ifMatch: null,
        ifNoneMatch: "*",
      },
    ]);
  });

  it("never overwrites the collection an earlier try created, which may have changed since", async () => {
    server.use(mswHttp.put(path, () => problem(412)));
    const createCollection = renderHook(() => useCreateCollection(), { wrapper }).result.current;
    const requests = recordRequests();

    await expect(createCollection.mutateAsync({ id, values: values() })).rejects.toMatchObject({
      status: 412,
    });
    expect(requests.filter((request) => request.endsWith(path))).toEqual([`PUT ${path}`]);
  });
});

describe("useSaveCollection", () => {
  it("keeps the saved cover file and sends no end year for one year", async () => {
    const puts = handlePuts(() =>
      HttpResponse.json(apiCollection("Саванна"), { headers: { ETag: savedEtag } }),
    );
    const saveCollection = renderHook(() => useSaveCollection(id), { wrapper }).result.current;
    const requests = recordRequests();

    await saveCollection.mutateAsync({
      etag: '"read"',
      values: { ...values(), endYear: "", photo: savedImage, photoAlt: "Новое описание" },
    });

    expect(requests).not.toContain("POST /api/uploads");
    expect(puts).toEqual([
      expect.objectContaining({
        body: expect.objectContaining({ cover: { alt: "Новое описание" }, endYear: null }),
        ifMatch: '"read"',
      }),
    ]);
  });
});
