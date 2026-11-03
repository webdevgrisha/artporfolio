import { describe, expect, it } from "vitest";
import { z } from "zod";

import { type ImageFieldValue, savedImage } from "@/shared/lib/imageFieldValue";
import {
  getPhotoChange,
  type PhotoFormValues,
  photoFieldsShape,
  refinePhoto,
  toPhotoFormValues,
} from "@/shared/lib/photoForm";

import { apiPhoto, imageFile } from "../../support/images";
import { fieldErrors } from "../../support/schema";

const photoFormSchema = z.object(photoFieldsShape).superRefine(refinePhoto);

function altErrors(values: PhotoFormValues): string[] {
  return fieldErrors(photoFormSchema, values).photoAlt ?? [];
}

describe("photo form fields", () => {
  it("needs a photo, and no description until there is one", () => {
    expect(fieldErrors(photoFormSchema, { photo: null, photoAlt: "" })).toEqual({
      photo: ["Выберите фото"],
    });
  });

  it.each<[string, ImageFieldValue]>([
    ["the saved photo", savedImage],
    ["a picked file", imageFile()],
  ])("needs a description for %s", (_name, photo) => {
    expect(altErrors({ photo, photoAlt: "  " })).toEqual(["Опишите, что на фото"]);
    expect(altErrors({ photo, photoAlt: "Портрет" })).toEqual([]);
  });

  it("trims the description", () => {
    expect(photoFormSchema.parse({ photo: savedImage, photoAlt: " Портрет " }).photoAlt).toBe(
      "Портрет",
    );
  });

  it("starts from the photo on the server, or from none", () => {
    expect(toPhotoFormValues(apiPhoto("Портрет"))).toEqual({
      photo: savedImage,
      photoAlt: "Портрет",
    });
    expect(toPhotoFormValues(null)).toEqual({ photo: null, photoAlt: "" });
  });
});

describe("getPhotoChange", () => {
  const file = imageFile();

  it("uploads a picked file with its description", () => {
    expect(getPhotoChange({ photo: file, photoAlt: "Портрет" }, { isAltDirty: false })).toEqual({
      alt: "Портрет",
      file,
      type: "upload",
    });
  });

  it("updates only the description of the saved photo when it was changed", () => {
    expect(
      getPhotoChange({ photo: savedImage, photoAlt: "Портрет" }, { isAltDirty: true }),
    ).toEqual({ alt: "Портрет", type: "updateAlt" });
    expect(
      getPhotoChange({ photo: savedImage, photoAlt: "Портрет" }, { isAltDirty: false }),
    ).toBeUndefined();
  });
});
