/** Mirrors the upload rules of PUT /api/contacts/photo (docs/API.md). */
export const photoRules = {
  accept: ["image/jpeg", "image/png"],
  acceptLabel: "JPEG или PNG",
  maxFileSize: 15 * 1024 * 1024,
} as const;
