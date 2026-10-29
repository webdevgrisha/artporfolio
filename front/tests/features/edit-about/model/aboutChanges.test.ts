import { describe, expect, it } from "vitest";

import type { About } from "@/entities/about";
import { getAboutChanges } from "@/features/edit-about/model/aboutChanges";
import { toAboutFormValues } from "@/features/edit-about/model/aboutFormValues";

import { apiPhoto, apiProcessPhoto, imageFile } from "../../../support/images";

const saved: About = {
  photo: apiPhoto("Портрет"),
  processPhotos: [apiProcessPhoto("a"), apiProcessPhoto("b")],
  text: { about: "Художница", biography: "Родилась…", creation: "Пишу маслом" },
};

const values = toAboutFormValues(saved);

describe("getAboutChanges", () => {
  it("is empty when nothing was changed", () => {
    expect(getAboutChanges(values, {}, saved)).toEqual({});
  });

  it("sends every text when one of them was changed: the server replaces them all", () => {
    expect(
      getAboutChanges({ ...values, creation: "Пишу акварелью" }, { creation: true }, saved),
    ).toEqual({
      text: { about: "Художница", biography: "Родилась…", creation: "Пишу акварелью" },
    });
  });

  it("sends each changed part", () => {
    const file = imageFile();
    const [a, b] = values.processPhotos;

    expect(
      getAboutChanges(
        { ...values, photo: file, processPhotos: [b, a] },
        // The process photos are compared by value, not by their dirty fields.
        { photo: true },
        saved,
      ),
    ).toEqual({
      photo: { alt: "Портрет", file, type: "upload" },
      processPhotos: {
        deletedIds: [],
        steps: [
          { id: "b", type: "keep" },
          { id: "a", type: "keep" },
        ],
      },
    });
  });
});

describe("toAboutFormValues", () => {
  it("starts with empty texts until they are first saved", () => {
    expect(toAboutFormValues({ photo: null, processPhotos: [], text: null })).toEqual({
      about: "",
      biography: "",
      creation: "",
      photo: null,
      photoAlt: "",
      processPhotos: [],
    });
  });

  it("makes a row of every saved process photo", () => {
    expect(values.processPhotos).toEqual([
      { alt: "Этап a", file: null, photoId: "a", status: "saved" },
      { alt: "Этап b", file: null, photoId: "b", status: "saved" },
    ]);
  });
});
