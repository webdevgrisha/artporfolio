import { describe, expect, it } from "vitest";

import { projectsIntroFormSchema } from "@/features/edit-projects/model/projectsIntroFormSchema";

import { toTranslationValues } from "@/shared/lib/translationsForm";

import { fieldErrors } from "../../../support/schema";

const translations = toTranslationValues({}, ["text"]);

describe("projectsIntroFormSchema", () => {
  it("needs a text", () => {
    expect(fieldErrors(projectsIntroFormSchema, { text: "О проектах.", translations })).toEqual({});
    expect(fieldErrors(projectsIntroFormSchema, { text: " \n ", translations })).toEqual({
      text: ["Введите текст"],
    });
  });
});
