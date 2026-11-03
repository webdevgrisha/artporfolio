import type { HTMLInputAutoCompleteAttribute, HTMLInputTypeAttribute } from "react";

import type { ContactLinks } from "@/entities/contacts";

interface ContactField {
  autoComplete: HTMLInputAutoCompleteAttribute;
  /** Marks an optional contact: an empty one is not shown on the site. */
  hint?: string;
  label: string;
  name: keyof ContactLinks;
  placeholder: string;
  type: HTMLInputTypeAttribute;
}

/** The form fields in display order. */
export const contactFields: readonly ContactField[] = [
  {
    autoComplete: "off",
    hint: "Необязательно",
    label: "Instagram",
    name: "instagram",
    placeholder: "Ссылка Instagram",
    type: "url",
  },
  {
    autoComplete: "email",
    label: "Email",
    name: "email",
    placeholder: "Адрес почты",
    type: "email",
  },
  {
    autoComplete: "off",
    hint: "Необязательно",
    label: "LinkedIn",
    name: "linkedin",
    placeholder: "Ссылка LinkedIn",
    type: "url",
  },
  {
    autoComplete: "off",
    hint: "Необязательно",
    label: "YouTube",
    name: "youtube",
    placeholder: "Ссылка YouTube",
    type: "url",
  },
];
