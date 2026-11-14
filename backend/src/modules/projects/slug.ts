import slugify from "@sindresorhus/slugify";

/** Long enough for the words that tell a project apart, short enough for a link. */
const maxSlugLength = 60;

/** The slug of a title with no letters or digits to make one of, such as one of emoji. */
const fallbackSlug = "project";

/**
 * The slug of a new project, its anchor in a link to it on the site, such as
 * `/en/projects#strekoza`: its title in Latin letters, the same in every language. Made once,
 * when the project is created, so renaming it never breaks a link to it. A slug another project
 * has gets a number, the first free from 2.
 */
export function newProjectSlug(title: string, taken: ReadonlySet<string>): string {
  const base = slugify(title).slice(0, maxSlugLength).replace(/-+$/u, "") || fallbackSlug;
  let slug = base;

  for (let number = 2; taken.has(slug); number += 1) {
    slug = `${base}-${number}`;
  }

  return slug;
}
