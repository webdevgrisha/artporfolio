import { projectsIntro, projectsIntroTranslations } from "#modules/projects/intro/resource";
import type { ProjectsIntro } from "#modules/projects/intro/schema";
import { entityTag, type Tagged } from "#shared/http/etag";
import type { Language } from "#shared/i18n/languages";
import { readTranslations, translatedText } from "#shared/i18n/translated-text";

/**
 * The text in `language`, tagged by it. In the source language, which the admin reads, it is the
 * saved text with the tag a change sends in If-Match.
 */
export async function getProjectsIntro(language: Language): Promise<Tagged<ProjectsIntro>> {
  const [snapshot, translations] = await Promise.all([
    projectsIntro.document().get(),
    readTranslations(projectsIntroTranslations, language),
  ]);
  const { text } = projectsIntro.read(snapshot);
  const data = { text: translatedText(translations, language, "text", text) };

  return { data, etag: entityTag(data) };
}
