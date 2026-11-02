/**
 * The key two titles are compared by: the visitor reads "Графика" and "графика" as the same
 * title, so a list may not have both.
 */
export function titleKey(title: string): string {
  return title.toLocaleLowerCase("ru");
}

const titleCollator = new Intl.Collator("ru");

/** Sorts by title in the Russian alphabet, as the site and the admin list named things. */
export function byTitle(a: { title: string }, b: { title: string }): number {
  return titleCollator.compare(a.title, b.title);
}

/**
 * Reports every item whose id or title repeats an earlier one in the list, at the path of the
 * repeated value, so the client can show the error next to it.
 */
export function findRepeats(
  items: readonly { id: string; title: string }[],
): { index: number; field: "id" | "title" }[] {
  const ids = new Set<string>();
  const titles = new Set<string>();
  const repeats: { index: number; field: "id" | "title" }[] = [];

  items.forEach(({ id, title }, index) => {
    if (ids.has(id)) {
      repeats.push({ field: "id", index });
    }

    if (titles.has(titleKey(title))) {
      repeats.push({ field: "title", index });
    }

    ids.add(id);
    titles.add(titleKey(title));
  });

  return repeats;
}
