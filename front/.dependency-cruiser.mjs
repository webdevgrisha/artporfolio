/**
 * The import rules of Feature-Sliced Design (docs/ARCHITECTURE.md, "Import rules"). The paths are
 * the resolved ones, so the rules hold for `@/` and relative imports alike.
 */

/** The layers from the top down. */
const layers = ["app", "pages", "widgets", "features", "entities", "shared"];

/** The layers made of slices: the app and shared have none. */
const sliced = "(entities|features|widgets|pages)";

/** A layer imports only from the layers below it. */
const layerRules = layers.slice(1).map((layer, index) => ({
  comment: `The ${layer} layer may only import from the layers below it.`,
  from: { path: `^src/${layer}/` },
  name: `${layer}-imports-only-lower-layers`,
  severity: "error",
  to: { path: `^src/(${layers.slice(0, index + 1).join("|")})/` },
}));

/** @type {import("dependency-cruiser").IConfiguration} */
export default {
  forbidden: [
    ...layerRules,
    {
      comment:
        "Slices of the same layer do not import each other: a shared need moves down a layer.",
      from: { path: `^src/${sliced}/([^/]+)/` },
      name: "no-imports-between-slices",
      severity: "error",
      to: { path: "^src/$1/", pathNot: "^src/$1/$2/" },
    },
    {
      comment: "Another slice is imported only through its public index.ts.",
      from: { path: `^src/${sliced}/([^/]+)/` },
      name: "slices-import-public-index",
      severity: "error",
      to: {
        path: `^src/${sliced}/[^/]+/.`,
        pathNot: [`^src/${sliced}/[^/]+/index\\.ts$`, "^src/$1/$2/"],
      },
    },
    {
      comment: "The app and shared import a slice only through its public index.ts.",
      from: { path: "^src/(app|shared)/" },
      name: "layers-import-public-index",
      severity: "error",
      to: { path: `^src/${sliced}/[^/]+/.`, pathNot: `^src/${sliced}/[^/]+/index\\.ts$` },
    },
    {
      comment:
        "Modules that import each other have no order of their own to read or change them in.",
      from: {},
      name: "no-circular",
      severity: "error",
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.app.json" },
    tsPreCompilationDeps: true,
  },
};
