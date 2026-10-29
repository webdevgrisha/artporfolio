import { describe, expect, it } from "vitest";

import {
  imageFieldValueSchema,
  savedImage,
  toImageFieldValue,
  toSavedImageFieldValue,
} from "@/shared/lib/imageFieldValue";

import { apiImage, imageFile } from "../../support/images";

describe("imageFieldValue", () => {
  it("takes the saved image, a file or no image, and nothing else", () => {
    expect(imageFieldValueSchema.safeParse(savedImage).success).toBe(true);
    expect(imageFieldValueSchema.safeParse(imageFile()).success).toBe(true);
    expect(imageFieldValueSchema.safeParse(null).success).toBe(true);
    expect(imageFieldValueSchema.safeParse("photo.png").success).toBe(false);
  });

  it("is the saved image for an image on the server and null for none", () => {
    expect(toImageFieldValue(apiImage())).toBe(savedImage);
    expect(toImageFieldValue(null)).toBeNull();
  });

  it("turns a picked file into the saved image once it is saved", () => {
    expect(toSavedImageFieldValue(imageFile())).toBe(savedImage);
    expect(toSavedImageFieldValue(savedImage)).toBe(savedImage);
    expect(toSavedImageFieldValue(null)).toBeNull();
  });
});
