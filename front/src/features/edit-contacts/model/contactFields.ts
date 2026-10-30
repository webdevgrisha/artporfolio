import type { HTMLInputAutoCompleteAttribute, HTMLInputTypeAttribute } from "react";

import type { ContactLinks } from "@/entities/contacts";

interface ContactField {
  autoComplete: HTMLInputAutoCompleteAttribute;
  label: string;
  name: keyof ContactLinks;
  placeholder: string;
  type: HTMLInputTypeAttribute;
}

/** The form fields in display order. */
export const contactFields: readonly ContactField[] = [
  {
    autoComplete: "off",
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
    label: "LinkedIn",
    name: "linkedin",
    placeholder: "Ссылка LinkedIn",
    type: "url",
  },
  {
    autoComplete: "off",
    label: "YouTube",
    name: "youtube",
    placeholder: "Ссылка YouTube",
    type: "url",
  },
];
