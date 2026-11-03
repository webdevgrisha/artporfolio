import type { MultiSelectOption } from "@/shared/ui/multi-select";

/** An item of a gallery list a work refers to by id, such as a material. */
interface TitledItem {
  id: string;
  title: string;
}

/** The items of a gallery list to choose from, in the order of the list: by title. */
export function toTitleOptions(items: readonly TitledItem[]): MultiSelectOption[] {
  return items.map(({ id, title }) => ({ label: title, value: id }));
}

/** The titles of the items a work names, in the order it names them; unknown ids are skipped. */
export function titlesOf(ids: readonly string[], items: readonly TitledItem[]): string[] {
  const titles = new Map(items.map(({ id, title }) => [id, title]));

  return ids.flatMap((id) => titles.get(id) ?? []);
}
