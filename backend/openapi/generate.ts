import { writeFile } from "node:fs/promises";

import { renderOpenApiDocument } from "./document.ts";

const output = new URL("openapi.yaml", import.meta.url);

await writeFile(output, renderOpenApiDocument());
console.log(`Wrote ${output.pathname}`);
