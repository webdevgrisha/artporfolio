import { describe, expect, it } from "vitest";

import { translationContext } from "#modules/translations/translation-context";

describe("translationContext", () => {
  it("names a resource of its own", () => {
    expect(translationContext("about-text", {})).toContain("биография");
  });

  it("names a resource by the start of its name, with the id left out", () => {
    expect(translationContext("gallery-work-11111111", {})).toContain("картины");
    expect(translationContext("project-11111111", {})).toContain("проекта");
  });

  it("tells a project from the introduction to the projects", () => {
    expect(translationContext("projects-intro", {})).toContain("Вступление");
  });

  it("adds the title and the description the short texts are read against", () => {
    const sources = { description: "Озеро на рассвете.", title: "Тише воды" };

    expect(translationContext("gallery-work-1", sources)).toBe(
      "Название и описание картины на сайте художника. Название: Тише воды. Описание: Озеро на рассвете.",
    );
  });

  it("leaves out a title or a description that is empty", () => {
    expect(translationContext("gallery-work-1", { description: "", title: "Слон" })).toBe(
      "Название и описание картины на сайте художника. Название: Слон",
    );
  });

  it("has a general text for anything else", () => {
    expect(translationContext("unknown", {})).toBe("Текст сайта художника");
  });
});
