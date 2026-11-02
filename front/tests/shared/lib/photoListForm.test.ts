import { describe, expect, it } from "vitest";

import { type PhotoListRow, photoListRowsSchema } from "@/shared/lib/photoListForm";

import { apiListPhoto, imageFile } from "../../support/images";
import { fieldErrors } from "../../support/schema";

function savedRow(id: string, alt = "Этап"): PhotoListRow {
  return { alt, file: null, photo: apiListPhoto(id), status: "saved" };
}

describe("photoListRowsSchema", () => {
  const schema = photoListRowsSchema(3);

  it("needs a description of every photo, saved or new", () => {
    expect(
      fieldErrors(schema, [
        savedRow("a", ""),
        { alt: " ", file: imageFile(), status: "new" },
        savedRow("b"),
      ]),
    ).toEqual({
      "0.alt": ["Опишите, что на фото"],
      "1.alt": ["Опишите, что на фото"],
    });
  });

  it("limits the number of photos", () => {
    expect(
      fieldErrors(
        schema,
        ["a", "b", "c", "d"].map((id) => savedRow(id)),
      ),
    ).toEqual({
      "": ["Не больше 3 фото"],
    });
  });
});
