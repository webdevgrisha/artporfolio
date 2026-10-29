import { stringify } from "yaml";
import { createDocument } from "zod-openapi";

import { authPaths } from "#modules/auth/openapi";
import { contactsPaths } from "#modules/contacts/openapi";
import { healthPaths } from "#modules/health/openapi";
import { pagesPaths } from "#modules/pages/openapi";
import { securitySchemes } from "#shared/openapi/security";

const description = `
API of the art portfolio: the public site reads it, the admin panel changes it.

- Bodies are JSON unless an operation says otherwise. Unknown fields are rejected.
- Errors are Problem Details (RFC 9457), sent as \`application/problem+json\`.
- Any operation can answer \`403\` to a browser request from an origin outside the CORS allowlist,
  and \`500\` to an unexpected error, which is logged and has no \`detail\`.
- A JSON body is limited to 100 KB; a larger one returns \`413\`.
- A path parameter that names nothing, such as an unknown page, returns \`404\`.
`.trim();

export function createOpenApiDocument() {
  return createDocument({
    openapi: "3.1.0",
    info: { title: "Art portfolio API", version: "1.0.0", description },
    tags: [
      { name: "Health" },
      { name: "Auth", description: "The admin session and CSRF protection." },
      { name: "Contacts", description: "Contact links and the contact photo." },
      { name: "Pages", description: "Pages of the public site and their main photos (heroes)." },
    ],
    paths: { ...healthPaths, ...authPaths, ...contactsPaths, ...pagesPaths },
    components: { securitySchemes },
  });
}

/** The document as committed in openapi.yaml. */
export function renderOpenApiDocument(): string {
  // No YAML anchors: shared objects are written out in full, as OpenAPI tools expect.
  return stringify(createOpenApiDocument(), { aliasDuplicateObjects: false, lineWidth: 0 });
}
