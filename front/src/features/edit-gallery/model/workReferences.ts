import type { MultiSelectOption } from "@/shared/ui/multi-select";
import type { SelectOption } from "@/shared/ui/select";

/** An item of a gallery list a work refers to by id, such as a material. */
interface TitledItem {
  id: string;
  title: string;
}

/** The items of a gallery list to choose from, in the order of the list: by title. */
export function toTitleOptions(items: readonly TitledItem[]): MultiSelectOption[] {
  return items.map(({ id, title }) => ({ label: title, value: id }));
}

const titleCollator = new Intl.Collator("ru");

/**
 * The collections to choose from, by title, after the choice of none: a work on its own. The site
 * lists the collections by their years, but a title is what the admin looks for in a list.
 */
export function toCollectionOptions(collections: readonly TitledItem[]): SelectOption[] {
  return [
    { label: "Без коллекции", value: "" },
    ...collections
      .toSorted((a, b) => titleCollator.compare(a.title, b.title))
      .map(({ id, title }) => ({ label: title, value: id })),
  ];
}

/** The titles of the items a work names, in the order of the list; unknown ids are skipped. */
export function titlesOf(ids: readonly string[], items: readonly TitledItem[]): string[] {
  return items.filter((item) => ids.includes(item.id)).map((item) => item.title);
}
