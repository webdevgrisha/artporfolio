/** Whether the text contains what was typed in a search, in any case. */
export function containsText(text: string, query: string): boolean {
  return text.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"));
}
