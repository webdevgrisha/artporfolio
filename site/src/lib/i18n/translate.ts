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

/**
 * A text of the interface in the given language. A text not translated yet shows in English, so
 * the page never shows an empty place or a key.
 */
export function t(language: Language, key: MessageKey): string {
  return messagesByLanguage.get(language)?.[key] ?? english[key];
}
