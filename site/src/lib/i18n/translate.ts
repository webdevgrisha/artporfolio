import { typeset } from "@/lib/text/typeset";

import type { Language } from "./languages";
import english from "./messages/en.json";

/** A text of the interface, by its key in `messages/en.json`, the source of every translation. */
export type MessageKey = keyof typeof english;

type Messages = Partial<Record<MessageKey, string>>;

const files = import.meta.glob<Messages>("./messages/*.json", { eager: true, import: "default" });

const messagesByLanguage = new Map(
  Object.entries(files).map(([path, messages]) => [
    path.slice("./messages/".length, -".json".length),
    messages,
  ]),
);

/** The texts set already, by language and key: each is set once per server, not per page. */
const typesetMessages = new Map<string, string>();

/**
 * A text of the interface in the given language, set by its typographic rules (`typeset`). A text
 * not translated yet shows in English, so the page never shows an empty place or a key.
 */
export function t(language: Language, key: MessageKey): string {
  const id = `${language}:${key}`;
  let text = typesetMessages.get(id);

  if (text === undefined) {
    text = typeset(language, messagesByLanguage.get(language)?.[key] ?? english[key]);
    typesetMessages.set(id, text);
  }

  return text;
}
