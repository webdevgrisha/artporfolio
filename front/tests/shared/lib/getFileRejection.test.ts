import { describe, expect, it } from "vitest";

import { imageUploadRules } from "@/shared/api/image";
import { type FileRules, getFileRejection } from "@/shared/lib/getFileRejection";

const rules: FileRules = { ...imageUploadRules, maxFileSize: 10 };

function file(name: string, type: string, size = 5): File {
  return new File(["x".repeat(size)], name, { type });
}

describe("getFileRejection", () => {
  it.each([
    ["photo.jpg", "image/jpeg"],
    ["photo.png", "image/png"],
  ])("accepts %s of an accepted type", (name, type) => {
    expect(getFileRejection(file(name, type), rules)).toBeUndefined();
  });

  it("rejects a type that is not accepted, whatever the extension", () => {
    expect(getFileRejection(file("photo.png", "image/gif"), rules)).toBe(
      "Файл «photo.png» не подходит. Можно выбрать JPEG или PNG",
    );
  });

  it("decides by the extension, in any case, when the browser does not know the type", () => {
    expect(getFileRejection(file("PHOTO.JPEG", ""), rules)).toBeUndefined();
    expect(getFileRejection(file("photo.gif", ""), rules)).toMatch(/не подходит/);
  });

  it.each(["photo", ".png"])("rejects %s without a type or an extension", (name) => {
    expect(getFileRejection(file(name, ""), rules)).toMatch(/не подходит/);
  });

  it("accepts a file of the largest size and rejects a larger one", () => {
    expect(getFileRejection(file("photo.png", "image/png", 10), rules)).toBeUndefined();
    expect(getFileRejection(file("photo.png", "image/png", 11), rules)).toBe(
      "Файл «photo.png» больше 10 Б",
    );
  });
});
