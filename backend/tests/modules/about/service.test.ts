import { beforeEach, describe, expect, it, vi } from "vitest";

const document = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("#modules/about/document", () => ({ aboutDocument: () => document }));
vi.mock("#shared/firebase/storage", () => ({
  downloadUrl: ({ path, token }: { path: string; token: string }) =>
    `https://storage.test/${path}?token=${token}`,
}));

import { getAbout } from "#modules/about/service";

const text = { about: "Иллюстратор.", biography: "Родилась в Минске.", creation: "Пишет маслом." };

const storedImage = {
  fileName: "photo.png",
  fileSize: 100,
  height: 320,
  sources: {
    avif: [{ path: "about/photo/v/640.avif", token: "token", width: 640 }],
    webp: [{ path: "about/photo/v/640.webp", token: "token", width: 640 }],
  },
  version: "v",
  width: 640,
};

function storedAs(fields: Record<string, unknown>) {
  document.get.mockResolvedValue({ get: (field: string) => fields[field] });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("about service", () => {
  it("returns an empty page before anything is saved", async () => {
    storedAs({});

    await expect(getAbout()).resolves.toEqual({
      text: { about: "", biography: "", creation: "" },
      photo: null,
      processPhotos: [],
    });
  });

  it("returns the texts and both kinds of photos from one read", async () => {
    const processId = "11111111-1111-4111-8111-111111111111";
    storedAs({
      text,
      photo: { ...storedImage, alt: "Portrait" },
      processPhotos: [{ ...storedImage, alt: "Sketch", id: processId }],
    });

    const about = await getAbout();

    expect(about.text).toEqual(text);
    expect(about.photo).toMatchObject({ alt: "Portrait" });
    expect(about.photo?.sources.avif[0]?.url).toBe(
      "https://storage.test/about/photo/v/640.avif?token=token",
    );
    expect(about.processPhotos).toEqual([
      expect.objectContaining({ alt: "Sketch", id: processId }),
    ]);
    expect(document.get).toHaveBeenCalledTimes(1);
  });
});
