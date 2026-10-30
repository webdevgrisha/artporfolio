import { describe, expect, it } from "vitest";
import { toProcessPhotoRows } from "@/features/edit-about/model/processPhotoRows";
import { getProcessPhotosChanges } from "@/features/edit-about/model/processPhotosChanges";
import type { ProcessPhotoRow } from "@/features/edit-about/model/processPhotosFormSchema";

import { apiProcessPhoto, imageFile } from "../../../support/images";

const saved = [apiProcessPhoto("a"), apiProcessPhoto("b"), apiProcessPhoto("c")];
const [a, b, c] = saved;

describe("getProcessPhotosChanges", () => {
  it("is undefined when every photo is kept as saved, in the same order", () => {
    expect(getProcessPhotosChanges(toProcessPhotoRows(saved), saved)).toBeUndefined();
    expect(getProcessPhotosChanges([], [])).toBeUndefined();
  });

  it("keeps the photos in their new order when they were moved", () => {
    const [rowA, rowB, rowC] = toProcessPhotoRows(saved);

    expect(getProcessPhotosChanges([rowC, rowA, rowB], saved)).toEqual({
      deleted: [],
      isReordered: true,
      steps: [
        { photo: c, type: "keep" },
        { photo: a, type: "keep" },
        { photo: b, type: "keep" },
      ],
    });
  });

  it("deletes the saved photos that are no longer in the list", () => {
    const rows = toProcessPhotoRows(saved).filter(
      (row) => row.status === "saved" && row.photo.id !== "b",
    );

    expect(getProcessPhotosChanges(rows, saved)).toEqual({
      deleted: [b],
      isReordered: false,
      steps: [
        { photo: a, type: "keep" },
        { photo: c, type: "keep" },
      ],
    });
  });

  it("makes one step per changed row", () => {
    const added = imageFile("added.png");
    const replacement = imageFile("replacement.png");
    const rows: ProcessPhotoRow[] = [
      { alt: "Новый этап", file: added, status: "new" },
      { alt: "Этап a", file: replacement, photo: a, status: "saved" },
      { alt: "Эскиз", file: null, photo: b, status: "saved" },
      // The same description as on the server.
      { alt: "Этап c", file: null, photo: c, status: "saved" },
    ];

    expect(getProcessPhotosChanges(rows, saved)).toEqual({
      deleted: [],
      // The server puts an added photo at the end.
      isReordered: true,
      steps: [
        { alt: "Новый этап", file: added, type: "add" },
        { alt: "Этап a", file: replacement, photo: a, type: "replace" },
        { alt: "Эскиз", photo: b, type: "updateAlt" },
        { photo: c, type: "keep" },
      ],
    });
  });

  it("needs no new order for photos added at the end", () => {
    const rows: ProcessPhotoRow[] = [
      ...toProcessPhotoRows(saved),
      { alt: "Новый этап", file: imageFile(), status: "new" },
    ];

    expect(getProcessPhotosChanges(rows, saved)?.isReordered).toBe(false);
  });

  it("counts a saved row that the server list does not have yet as added", () => {
    // Saved a moment ago, before the server list is loaded again.
    const rows = toProcessPhotoRows([...saved, apiProcessPhoto("new-1")]);

    expect(getProcessPhotosChanges(rows, saved)).toBeUndefined();
  });
});
