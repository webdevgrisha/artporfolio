import { describe, expect, it } from "vitest";

import {
  type AboutFormValues,
  aboutFormSchema,
  type ProcessPhotoRow,
} from "@/features/edit-about/model/aboutFormSchema";

import { imageFile } from "../../../support/images";
import { fieldErrors } from "../../../support/schema";

const values: AboutFormValues = {
  about: "",
  biography: "",
  creation: "",
  photo: null,
  photoAlt: "",
  processPhotos: [],
};

function errors(changed: Partial<AboutFormValues>): Record<string, string[]> {
  return fieldErrors(aboutFormSchema, { ...values, ...changed });
}

function savedRow(photoId: string, alt = "Этап"): ProcessPhotoRow {
  return { alt, file: null, photoId, status: "saved" };
}

describe("aboutFormSchema", () => {
  it("takes empty texts: their sections are hidden on the site", () => {
    expect(errors({})).toEqual({});
  });

  it("trims the texts", () => {
    expect(aboutFormSchema.parse({ ...values, biography: "\n Родилась… \n" }).biography).toBe(
      "Родилась…",
    );
  });

  it("needs a description of «Моё фото»", () => {
    expect(errors({ photo: "saved" })).toEqual({ photoAlt: ["Опишите, что на фото"] });
  });

  it("needs a description of every process photo, saved or new", () => {
    expect(
      errors({
        processPhotos: [
          savedRow("a", ""),
          { alt: " ", file: imageFile(), status: "new" },
          savedRow("b"),
        ],
      }),
    ).toEqual({
      "processPhotos.0.alt": ["Опишите, что на фото"],
      "processPhotos.1.alt": ["Опишите, что на фото"],
    });
  });
});
