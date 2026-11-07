const monthNames = new Intl.DateTimeFormat("ru", { month: "long" });

/** The name of the month on its own, as in a list: «март» for 3. */
function monthName(month: number): string {
  return monthNames.format(new Date(2000, month - 1, 1));
}

/** The months to choose from, «Январь» to «Декабрь». */
export const monthOptions = Array.from({ length: 12 }, (_, index) => {
  const name = monthName(index + 1);

  return { label: name.charAt(0).toUpperCase() + name.slice(1), value: String(index + 1) };
});

/** When the work was finished, as the admin reads it: «март 2024». */
export function formatWorkDate({ month, year }: { month: number; year: number }): string {
  return `${monthName(month)} ${String(year)}`;
}
