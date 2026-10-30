import { describe, expect, it } from "vitest";

import {
  type AboutTextFormValues,
  aboutTextFormSchema,
  toAboutTextFormValues,
} from "@/features/edit-about/model/aboutTextFormSchema";

import { fieldErrors } from "../../../support/schema";

const values: AboutTextFormValues = { about: "", biography: "", creation: "" };

describe("aboutTextFormSchema", () => {
  it("takes empty texts: their sections are hidden on the site", () => {
    expect(fieldErrors(aboutTextFormSchema, values)).toEqual({});
  });

  it("trims the texts", () => {
    expect(aboutTextFormSchema.parse({ ...values, biography: "\n Родилась… \n" }).biography).toBe(
      "Родилась…",
    );
  });
});

describe("toAboutTextFormValues", () => {
  it("starts with empty texts until they are first saved", () => {
    expect(toAboutTextFormValues(null)).toEqual(values);
  });
});
