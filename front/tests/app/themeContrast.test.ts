import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/styles/globals.css", "utf8");

/** The `--color-*` tokens written as hex in the block that starts at `selector`. */
function readTokens(selector: string): Record<string, string> {
  const block = css.slice(css.indexOf(selector), css.indexOf("}", css.indexOf(selector)));

  return Object.fromEntries(
    [...block.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]+);/g)].map(([, name, hex]) => [name, hex]),
  );
}

const lightTokens = readTokens(":root {");
const themes = {
  dark: { ...lightTokens, ...readTokens(':root[data-theme="dark"] {') },
  light: lightTokens,
};

function channel(hex: string, index: number): number {
  const digits = hex.slice(1);
  const pair =
    digits.length === 3 ? digits.charAt(index).repeat(2) : digits.slice(index * 2, index * 2 + 2);
  const value = Number.parseInt(pair, 16) / 255;

  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);
}

/** The contrast ratio of WCAG 2. */
function contrast(first: string, second: string): number {
  const [one, other] = [luminance(first), luminance(second)];

  return (Math.max(one, other) + 0.05) / (Math.min(one, other) + 0.05);
}

/** The value of a token; a renamed token fails here instead of comparing nothing. */
function color(tokens: Record<string, string>, name: string): string {
  const value = tokens[name];

  if (!value) {
    throw new Error(`There is no --color-${name}`);
  }

  return value;
}

const textTokens = ["text", "text-muted", "danger", "success", "warning"];
const surfaceTokens = ["surface", "surface-raised", "surface-disabled"];
const lineTokens = ["border", "border-modified", "danger", "focus"];

describe.each(Object.entries(themes))("the %s theme", (_name, tokens) => {
  it.each(textTokens)("keeps %s readable on every surface", (text) => {
    for (const surface of surfaceTokens) {
      expect(contrast(color(tokens, text), color(tokens, surface))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(lineTokens)("keeps the %s line visible on every surface", (line) => {
    for (const surface of surfaceTokens) {
      expect(contrast(color(tokens, line), color(tokens, surface))).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps the inverse text readable on the fills", () => {
    const inverseText = color(tokens, "text-inverse");

    expect(contrast(inverseText, color(tokens, "surface-inverse"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(inverseText, color(tokens, "danger"))).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(color(tokens, "text-emphasis"), color(tokens, "surface-emphasis")),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe("the dark theme", () => {
  it("makes each surface lighter than the one under it", () => {
    const [page, raised, rowHover] = ["surface", "surface-raised", "surface-disabled"].map((name) =>
      luminance(color(themes.dark, name)),
    );

    expect(raised).toBeGreaterThan(page ?? 1);
    expect(rowHover).toBeGreaterThan(raised ?? 1);
  });

  it("keeps a black swatch visible", () => {
    expect(contrast(color(themes.dark, "swatch-line"), "#000")).toBeGreaterThanOrEqual(3);
  });
});
