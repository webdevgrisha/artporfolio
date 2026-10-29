/** One text of several messages, such as the errors of a save; `undefined` when there are none. */
export function joinMessages(messages: ReadonlySet<string>): string | undefined {
  return messages.size > 0 ? [...messages].join(". ") : undefined;
}
