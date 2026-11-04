import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { HttpResponse, http as mswHttp } from "msw/http";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import type { GalleryWork } from "@/entities/gallery";
import { emptyWorkFormValues } from "@/features/edit-gallery/model/workFormSchema";
import { useCreateWork, useSaveWork } from "@/features/edit-gallery/model/workMutations";
import { savedImage } from "@/shared/lib/imageFieldValue";

import { csrfHandler, problem, uploadId, uploadsHandler } from "../../../support/handlers";
import { recordRequests, server } from "../../../support/server";

const id = "11111111-1111-4111-8111-111111111111";
const path = `/api/gallery-works/${id}`;
const sectionId = "22222222-2222-4222-8222-222222222222";
const materialId = "33333333-3333-4333-8333-333333333333";
const colorId = "55555555-5555-4555-8555-555555555555";
const paletteId = "66666666-6666-4666-8666-666666666666";
/** The values of the form, with a new file each time: a file once uploaded is not sent again. */
const values = () => ({
  ...emptyWorkFormValues,
  height: "27,9",
  photo: new File(["png"], "dragonfly.png", { type: "image/png" }),
  photoAlt: "Стрекоза",
  title: "Стрекоза",
  width: "21,6",
  year: "2025",
  month: "4",
  sectionIds: [sectionId],
  materialIds: [materialId],
  colorIds: [colorId],
  paletteIds: [paletteId],
});
const savedEtag = '"saved"';

function apiWork(title: string): GalleryWork {
  return {
    createdAt: "2026-01-15T10:00:00.000Z",
    description: "",
    id,
    photo: {
      alt: "Стрекоза",
      fileName: "dragonfly.png",
      fileSize: 100,
      height: 640,
      sources: {
        avif: [{ url: "https://storage.test/dragonfly/960.avif", width: 960 }],
        webp: [{ url: "https://storage.test/dragonfly/960.webp", width: 960 }],
      },
      version: "version",
      width: 960,
    },
    processPhotos: [],
    sectionIds: [sectionId],
    materialIds: [materialId],
    colorIds: [colorId],
    paletteIds: [paletteId],
    collectionId: null,
    format: "single",
    partCount: null,
    price: null,
    size: { height: 27.9, width: 21.6 },
    title,
    updatedAt: "2026-01-15T10:00:00.000Z",
    year: 2025,
    month: 4,
    place: "",
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

/** Answers each PUT of the work with `respond`, and records its body and conditional headers. */
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

describe("useCreateWork", () => {
  it("uploads the photo and creates the work with its size and year as numbers", async () => {
    const puts = handlePuts(() =>
      HttpResponse.json(
        { work: apiWork("Стрекоза") },
        { headers: { ETag: savedEtag }, status: 201 },
      ),
    );
    const createWork = renderHook(() => useCreateWork(), { wrapper }).result.current;

    const work = await createWork.mutateAsync({ id, values: values() });

    expect(work.title).toBe("Стрекоза");
    expect(puts).toEqual([
      {
        body: {
          description: "",
          photo: { alt: "Стрекоза", uploadId },
          processPhotos: [],
          sectionIds: [sectionId],
          materialIds: [materialId],
          colorIds: [colorId],
          paletteIds: [paletteId],
          collectionId: null,
          format: "single",
          partCount: null,
          price: null,
          size: { height: 27.9, width: 21.6 },
          title: "Стрекоза",
          year: 2025,
          month: 4,
          place: "",
        },
        ifMatch: null,
        ifNoneMatch: "*",
      },
    ]);
  });

  it("saves the values into the work an earlier try created", async () => {
    const createdEtag = '"created"';
    const puts = handlePuts(({ ifNoneMatch }) =>
      ifNoneMatch === "*"
        ? problem(412)
        : HttpResponse.json({ work: apiWork("Стрекоза") }, { headers: { ETag: savedEtag } }),
    );
    server.use(
      mswHttp.get(path, () =>
        HttpResponse.json({ work: apiWork("Стркоза") }, { headers: { ETag: createdEtag } }),
      ),
    );
    const createWork = renderHook(() => useCreateWork(), { wrapper }).result.current;
    const requests = recordRequests();

    await createWork.mutateAsync({ id, values: values() });

    expect(requests.filter((request) => request !== "GET /api/auth/csrf")).toEqual([
      "POST /api/uploads",
      `PUT ${path}`,
      `GET ${path}`,
      `PUT ${path}`,
    ]);
    expect(puts.map(({ ifMatch, ifNoneMatch }) => ({ ifMatch, ifNoneMatch }))).toEqual([
      { ifMatch: null, ifNoneMatch: "*" },
      { ifMatch: createdEtag, ifNoneMatch: null },
    ]);
  });
});

describe("useSaveWork", () => {
  it("sends the chosen collection by id", async () => {
    const collectionId = "77777777-7777-4777-8777-777777777777";
    const puts = handlePuts(() =>
      HttpResponse.json({ work: apiWork("Стрекоза") }, { headers: { ETag: savedEtag } }),
    );
    const saveWork = renderHook(() => useSaveWork(id), { wrapper }).result.current;

    await saveWork.mutateAsync({ etag: '"read"', values: { ...values(), collectionId } });

    expect(puts).toEqual([
      expect.objectContaining({ body: expect.objectContaining({ collectionId }) }),
    ]);
  });

  it("sends a set with its count of works as a number", async () => {
    const puts = handlePuts(() =>
      HttpResponse.json({ work: apiWork("Стрекоза") }, { headers: { ETag: savedEtag } }),
    );
    const saveWork = renderHook(() => useSaveWork(id), { wrapper }).result.current;

    await saveWork.mutateAsync({
      etag: '"read"',
      values: { ...values(), format: "set", partCount: "12" },
    });

    expect(puts).toEqual([
      expect.objectContaining({
        body: expect.objectContaining({ format: "set", partCount: 12 }),
      }),
    ]);
  });

  it("sends the price in dollars and the discount as numbers", async () => {
    const puts = handlePuts(() =>
      HttpResponse.json({ work: apiWork("Стрекоза") }, { headers: { ETag: savedEtag } }),
    );
    const saveWork = renderHook(() => useSaveWork(id), { wrapper }).result.current;

    await saveWork.mutateAsync({
      etag: '"read"',
      values: { ...values(), price: "1 500", discountPercent: " 10 " },
    });

    expect(puts).toEqual([
      expect.objectContaining({
        body: expect.objectContaining({
          price: { amount: 1500, currency: "USD", discountPercent: 10 },
        }),
      }),
    ]);
  });

  it("keeps the saved photo file and sends its description alone", async () => {
    const puts = handlePuts(() =>
      HttpResponse.json({ work: apiWork("Стрекоза") }, { headers: { ETag: savedEtag } }),
    );
    const saveWork = renderHook(() => useSaveWork(id), { wrapper }).result.current;
    const requests = recordRequests();

    await saveWork.mutateAsync({
      etag: '"read"',
      values: { ...values(), photo: savedImage, photoAlt: "Новое описание" },
    });

    expect(requests).not.toContain("POST /api/uploads");
    expect(puts).toEqual([
      expect.objectContaining({
        body: expect.objectContaining({ photo: { alt: "Новое описание" } }),
        ifMatch: '"read"',
      }),
    ]);
  });
});
