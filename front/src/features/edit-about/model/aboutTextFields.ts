interface AboutTextField {
  label: string;
  name: "about" | "biography" | "creation";
  placeholder: string;
}

/** The text fields in display order. */
export const aboutTextFields: readonly AboutTextField[] = [
  { label: "О себе", name: "about", placeholder: "Коротко о себе" },
  { label: "Биография", name: "biography", placeholder: "Биография" },
  { label: "Творчество", name: "creation", placeholder: "О творчестве" },
];
