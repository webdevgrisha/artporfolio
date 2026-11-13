import { slug } from "@/lib/text/slug";

/**
 * The anchor of each project in the list, which opens it from a link such as
 * `/en/projects#elephant`: its title as a slug, else, for a title without Latin letters, its id.
 * Two titles that make the same slug are told apart by a number, the first keeping the plain one.
 */
export function projectAnchors(projects: readonly { id: string; title: string }[]): string[] {
  const taken = new Set<string>();

  return projects.map(({ id, title }) => {
    const base = slug(title) || id;
    let anchor = base;

    for (let count = 2; taken.has(anchor); count += 1) {
      anchor = `${base}-${count}`;
    }

    taken.add(anchor);
    return anchor;
  });
}
