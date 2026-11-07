import type { ComponentType, ReactNode } from "react";

/** A text of a resource that a person can edit in every language. */
export interface TranslatedField {
  /** The name the server gives the text. */
  key: string;
  label: string;
  /** Whether the text takes several lines. */
  multiline?: boolean;
}

export interface LanguageFormProps {
  /** The form of the resource in Russian. */
  children: ReactNode;
  fields: readonly TranslatedField[];
  /** The name of the translations of the resource on the server. */
  resource: string;
  /** The ETag of the saved resource: a save may send texts to the translator. */
  savedTag: string;
}

/**
 * What puts a form in Russian beside its translations. A feature takes it from its page: editing
 * translations is a feature of its own, and features do not import each other.
 */
export type LanguageFormSlot = ComponentType<LanguageFormProps>;
