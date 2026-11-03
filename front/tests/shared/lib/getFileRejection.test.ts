import { afterEach, describe, expect, it, vi } from "vitest";

import { heroUploadRules, imageUploadRules } from "@/shared/api/image";
import { describeFileRules, type FileRules, getFileRejection } from "@/shared/lib/getFileRejection";

const rules: FileRules = {
  accept: imageUploadRules.accept,
  acceptLabel: imageUploadRules.acceptLabel,
  maxFileSize: 10,
};

function file(name: string, type: string, size = 5): File {
  return new File(["x".repeat(size)], name, { type });
}

/** Makes the browser decode every image to `width` × `height`, or fail to decode it. */
function decodeAs(size: { height: number; width: number } | "broken") {
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(() =>
      size === "broken"
        ? Promise.reject(new DOMException("The source image could not be decoded."))
        : Promise.resolve({ ...size, close: vi.fn() }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getFileRejection", () => {
  it.each([
    ["photo.jpg", "image/jpeg"],
    ["photo.png", "image/png"],
  ])("accepts %s of an accepted type", async (name, type) => {
    await expect(getFileRejection(file(name, type), rules)).resolves.toBeUndefined();
  });

  it("rejects a type that is not accepted, whatever the extension", async () => {
    await expect(getFileRejection(file("photo.png", "image/gif"), rules)).resolves.toBe(
      "Файл «photo.png» не подходит. Можно выбрать JPEG или PNG",
    );
  });

  it("decides by the extension, in any case, when the browser does not know the type", async () => {
    await expect(getFileRejection(file("PHOTO.JPEG", ""), rules)).resolves.toBeUndefined();
    await expect(getFileRejection(file("photo.gif", ""), rules)).resolves.toMatch(/не подходит/);
  });

  it.each(["photo", ".png"])("rejects %s without a type or an extension", async (name) => {
    await expect(getFileRejection(file(name, ""), rules)).resolves.toMatch(/не подходит/);
  });

  it("accepts a file of the largest size and rejects a larger one", async () => {
    await expect(
      getFileRejection(file("photo.png", "image/png", 10), rules),
    ).resolves.toBeUndefined();
    await expect(getFileRejection(file("photo.png", "image/png", 11), rules)).resolves.toBe(
      "Файл «photo.png» больше 10 Б",
    );
  });
});

describe("getFileRejection of the image size", () => {
  const photo = file("photo.jpg", "image/jpeg");

  it("measures a hero by its width", async () => {
    decodeAs({ height: 1_080, width: 1_920 });
    await expect(getFileRejection(photo, heroUploadRules)).resolves.toBeUndefined();

    decodeAs({ height: 2_400, width: 1_600 });
    await expect(getFileRejection(photo, heroUploadRules)).resolves.toBe(
      "Фото «photo.jpg» — 1600 × 2400 px, а нужно от 1920 px в ширину",
    );
  });

  it("measures other photos by their longer side, so a portrait is not held to the width", async () => {
    decodeAs({ height: 1_500, width: 1_200 });
    await expect(getFileRejection(photo, imageUploadRules)).resolves.toBeUndefined();

    decodeAs({ height: 800, width: 1_000 });
    await expect(getFileRejection(photo, imageUploadRules)).resolves.toBe(
      "Фото «photo.jpg» — 1000 × 800 px, а нужно от 1280 px по длинной стороне",
    );
  });

  it("leaves an image the browser cannot decode to the server", async () => {
    decodeAs("broken");

    await expect(getFileRejection(photo, imageUploadRules)).resolves.toBeUndefined();
  });

  it("does not decode a file of the wrong type", async () => {
    decodeAs({ height: 1, width: 1 });

    await expect(
      getFileRejection(file("photo.gif", "image/gif"), imageUploadRules),
    ).resolves.toMatch(/не подходит/);
    expect(createImageBitmap).not.toHaveBeenCalled();
  });
});

describe("describeFileRules", () => {
  it("lists the types, the largest file and the smallest image", () => {
    expect(describeFileRules(rules)).toBe("JPEG или PNG, до 10 Б");
    expect(describeFileRules(heroUploadRules)).toBe("JPEG или PNG, до 15 МБ, от 1920 px в ширину");
    expect(describeFileRules(imageUploadRules)).toBe(
      "JPEG или PNG, до 15 МБ, от 1280 px по длинной стороне",
    );
  });
});
