import { describe, expect, it } from "vitest";

import {
  type ProcessPhotoRow,
  processPhotosFormSchema,
} from "@/features/edit-about/model/processPhotosFormSchema";

import { apiProcessPhoto, imageFile } from "../../../support/images";
import { fieldErrors } from "../../../support/schema";

function savedRow(id: string, alt = "Этап"): ProcessPhotoRow {
  return { alt, file: null, photo: apiProcessPhoto(id), status: "saved" };
}

describe("processPhotosFormSchema", () => {
  it("needs a description of every process photo, saved or new", () => {
    expect(
      fieldErrors(processPhotosFormSchema, {
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
