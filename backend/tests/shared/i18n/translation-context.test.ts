import { describe, expect, it } from "vitest";

import { translationContext } from "#shared/i18n/translation-context";

describe("translationContext", () => {
  it("names a resource of its own", () => {
    expect(translationContext("about-text")).toContain("биография");
  });

  it("names a resource by the start of its name, with the id left out", () => {
    expect(translationContext("gallery-work-11111111")).toContain("картины");
    expect(translationContext("project-11111111")).toContain("проекта");
  });

  it("tells a project from the introduction to the projects", () => {
    expect(translationContext("projects-intro")).toContain("Вступление");
  });

  it("has a general text for anything else", () => {
    expect(translationContext("unknown")).toBe("Текст сайта художника");
  });
});
