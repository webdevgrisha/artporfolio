import { describe, expect, it } from "vitest";

import type { ProcessPhotoRow } from "@/features/edit-about/model/aboutFormSchema";
import { toProcessPhotoRows } from "@/features/edit-about/model/aboutFormValues";
import { getProcessPhotosChanges } from "@/features/edit-about/model/processPhotosChanges";

import { apiProcessPhoto, imageFile } from "../../../support/images";

const saved = [apiProcessPhoto("a"), apiProcessPhoto("b"), apiProcessPhoto("c")];

describe("getProcessPhotosChanges", () => {
  it("is undefined when every photo is kept as saved, in the same order", () => {
    expect(getProcessPhotosChanges(toProcessPhotoRows(saved), saved)).toBeUndefined();
    expect(getProcessPhotosChanges([], [])).toBeUndefined();
  });

  it("keeps the photos in their new order when they were moved", () => {
    const [a, b, c] = toProcessPhotoRows(saved);

    expect(getProcessPhotosChanges([c, a, b], saved)).toEqual({
      deletedIds: [],
      steps: [
        { id: "c", type: "keep" },
        { id: "a", type: "keep" },
        { id: "b", type: "keep" },
      ],
    });
  });

  it("deletes the saved photos that are no longer in the list", () => {
    const rows = toProcessPhotoRows(saved).filter(
      (row) => row.status === "saved" && row.photoId !== "b",
    );

    expect(getProcessPhotosChanges(rows, saved)).toEqual({
      deletedIds: ["b"],
      steps: [
        { id: "a", type: "keep" },
        { id: "c", type: "keep" },
      ],
    });
  });

  it("makes one step per changed row", () => {
    const added = imageFile("added.png");
    const replacement = imageFile("replacement.png");
    const rows: ProcessPhotoRow[] = [
      { alt: "Новый этап", file: added, status: "new" },
      { alt: "Этап a", file: replacement, photoId: "a", status: "saved" },
      { alt: "Эскиз", file: null, photoId: "b", status: "saved" },
      // The same description as on the server.
      { alt: "Этап c", file: null, photoId: "c", status: "saved" },
    ];

    expect(getProcessPhotosChanges(rows, saved)).toEqual({
      deletedIds: [],
      steps: [
        { alt: "Новый этап", file: added, type: "add" },
        { alt: "Этап a", file: replacement, id: "a", type: "replace" },
        { alt: "Эскиз", id: "b", type: "updateAlt" },
        { id: "c", type: "keep" },
      ],
    });
  });
});
