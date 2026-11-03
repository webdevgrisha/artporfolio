import { describe, expect, it } from "vitest";

import { aboutDocument } from "#modules/about/document";
import { aboutPhoto } from "#modules/about/photo";
import { contactsDocument } from "#modules/contacts/document";
import { contactPhoto } from "#modules/contacts/photo";
import { storedPhotoSchema } from "#shared/images/photo";
import { minPhotoSize } from "#shared/images/processing";

describe("photo slots", () => {
  it("keeps «My photo» in the photo field of the About document", () => {
    expect(aboutPhoto).toEqual({
      document: aboutDocument,
      field: "photo",
      folder: "about/photo",
      minSize: minPhotoSize,
      schema: storedPhotoSchema,
    });
  });

  it("keeps the contact photo in the photo field of the contacts document", () => {
    expect(contactPhoto).toEqual({
      document: contactsDocument,
      field: "photo",
      folder: "contacts/photo",
      minSize: minPhotoSize,
      schema: storedPhotoSchema,
    });
  });
});
