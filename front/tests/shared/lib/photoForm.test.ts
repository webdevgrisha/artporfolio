import { describe, expect, it } from "vitest";
import { z } from "zod";

import { type ImageFieldValue, savedImage } from "@/shared/lib/imageFieldValue";
import {
  getPhotoChange,
  type PhotoFormValues,
  photoFieldsShape,
  refinePhotoAlt,
  toPhotoFormValues,
  toSavedPhotoValues,
} from "@/shared/lib/photoForm";

import { apiPhoto, imageFile } from "../../support/images";
import { fieldErrors } from "../../support/schema";

const photoFormSchema = z.object(photoFieldsShape).superRefine(refinePhotoAlt);

function altErrors(values: PhotoFormValues): string[] {
  return fieldErrors(photoFormSchema, values).photoAlt ?? [];
}

describe("photo form fields", () => {
  it("needs no description without a photo", () => {
    expect(altErrors({ photo: null, photoAlt: "" })).toEqual([]);
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

  it("keeps a saved file with its description and drops the description of a deleted photo", () => {
    expect(toSavedPhotoValues({ photo: imageFile(), photoAlt: "Портрет" })).toEqual({
      photo: savedImage,
      photoAlt: "Портрет",
    });
    expect(toSavedPhotoValues({ photo: null, photoAlt: "Портрет" })).toEqual({
      photo: null,
      photoAlt: "",
    });
  });
});

describe("getPhotoChange", () => {
  const file = imageFile();

  it("uploads a picked file with its description", () => {
    expect(
      getPhotoChange(
        { photo: file, photoAlt: "Портрет" },
        { hasServerPhoto: true, isAltDirty: false },
      ),
    ).toEqual({ alt: "Портрет", file, type: "upload" });
  });

  it("deletes the photo on the server when it was removed", () => {
    expect(
      getPhotoChange({ photo: null, photoAlt: "" }, { hasServerPhoto: true, isAltDirty: true }),
    ).toEqual({ type: "delete" });
  });

  it("changes nothing when there was no photo to remove", () => {
    expect(
      getPhotoChange({ photo: null, photoAlt: "" }, { hasServerPhoto: false, isAltDirty: false }),
    ).toBeUndefined();
  });

  it("updates only the description of the saved photo when it was changed", () => {
    expect(
      getPhotoChange(
        { photo: savedImage, photoAlt: "Портрет" },
        { hasServerPhoto: true, isAltDirty: true },
      ),
    ).toEqual({ alt: "Портрет", type: "updateAlt" });
    expect(
      getPhotoChange(
        { photo: savedImage, photoAlt: "Портрет" },
        { hasServerPhoto: true, isAltDirty: false },
      ),
    ).toBeUndefined();
  });
});
