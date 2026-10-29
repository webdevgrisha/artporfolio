import { describe, expect, it } from "vitest";

import {
  type ContactsFormValues,
  contactsFormSchema,
} from "@/features/edit-contacts/model/contactsFormSchema";

import { fieldErrors } from "../../../support/schema";

const values: ContactsFormValues = {
  email: "",
  instagram: "",
  linkedin: "",
  photo: null,
  photoAlt: "",
  youtube: "",
};

function errors(changed: Partial<ContactsFormValues>): Record<string, string[]> {
  return fieldErrors(contactsFormSchema, { ...values, ...changed });
}

describe("contactsFormSchema", () => {
  it("takes empty contacts: they are hidden on the site", () => {
    expect(errors({})).toEqual({});
  });

  it("trims the links", () => {
    expect(
      contactsFormSchema.parse({ ...values, instagram: "  https://instagram.com/artist  " })
        .instagram,
    ).toBe("https://instagram.com/artist");
  });

  it("takes only http and https links", () => {
    expect(errors({ youtube: "https://youtube.com/@artist" })).toEqual({});
    expect(errors({ linkedin: "http://linkedin.com/in/artist" })).toEqual({});
    expect(errors({ instagram: "instagram.com/artist" })).toEqual({
      instagram: ["Введите ссылку вида https://…"],
    });
    expect(errors({ instagram: "ftp://instagram.com/artist" })).toEqual({
      instagram: ["Введите ссылку вида https://…"],
    });
  });

  it("takes only a valid email", () => {
    expect(errors({ email: "artist@example.com" })).toEqual({});
    expect(errors({ email: "artist@" })).toEqual({ email: ["Введите корректный email"] });
  });

  it("needs a description of the photo", () => {
    expect(errors({ photo: "saved", photoAlt: "" })).toEqual({
      photoAlt: ["Опишите, что на фото"],
    });
  });
});
