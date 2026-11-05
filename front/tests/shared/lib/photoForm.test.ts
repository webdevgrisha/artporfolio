import { describe, expect, it } from "vitest";
import { z } from "zod";

import { type ImageFieldValue, savedImage } from "@/shared/lib/imageFieldValue";
import {
  type PhotoFormValues,
  photoFieldsShape,
  refinePhoto,
  toPhotoBody,
  toPhotoFormValues,
} from "@/shared/lib/photoForm";

import { csrfHandler, uploadId, uploadsHandler } from "../../support/handlers";
import { apiPhoto, imageFile } from "../../support/images";
import { fieldErrors } from "../../support/schema";
import { server } from "../../support/server";

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

describe("toPhotoBody", () => {
  it("uploads a picked file and refers to it with its description", async () => {
    server.use(csrfHandler, uploadsHandler);

    await expect(toPhotoBody({ photo: imageFile(), photoAlt: "Портрет" })).resolves.toEqual({
      alt: "Портрет",
      uploadId,
    });
  });

  it("sends the description alone for the saved photo", async () => {
    await expect(toPhotoBody({ photo: savedImage, photoAlt: "Портрет" })).resolves.toEqual({
      alt: "Портрет",
    });
  });
});
