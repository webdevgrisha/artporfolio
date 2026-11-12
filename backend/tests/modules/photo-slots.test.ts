import { describe, expect, it } from "vitest";

import { aboutDocument } from "#modules/about/document";
import { aboutPhoto } from "#modules/about/photo";
import { storedPhotoSchema } from "#shared/images/photo";

describe("photo slots", () => {
  it("keeps «My photo» in the photo field of the About document", () => {
    expect(aboutPhoto).toEqual({
      document: aboutDocument,
      field: "photo",
      folder: "about/photo",
      resource: "about-photo",
      saveAlong: expect.any(Function),
      schema: storedPhotoSchema,
    });
  });
});
