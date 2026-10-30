import { describe, expect, it } from "vitest";

import {
  type ContactLinksFormValues,
  contactLinksFormSchema,
} from "@/features/edit-contacts/model/contactLinksFormSchema";

import { fieldErrors } from "../../../support/schema";

const values: ContactLinksFormValues = {
  email: "",
  instagram: "",
  linkedin: "",
  youtube: "",
};

function errors(changed: Partial<ContactLinksFormValues>): Record<string, string[]> {
  return fieldErrors(contactLinksFormSchema, { ...values, ...changed });
}

describe("contactLinksFormSchema", () => {
  it("takes empty contacts: they are hidden on the site", () => {
    expect(errors({})).toEqual({});
  });

  it("trims the links", () => {
    expect(
      contactLinksFormSchema.parse({ ...values, instagram: "  https://instagram.com/artist  " })
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
});
