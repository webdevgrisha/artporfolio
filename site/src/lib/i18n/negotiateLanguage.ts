import { isLanguage, type Language } from "./languages";

interface LanguageRange {
  tag: string;
  quality: number;
}

/** `de-AT;q=0.8` → `{ tag: "de-at", quality: 0.8 }`; a range without a valid weight weighs 1. */
function parseRange(range: string): LanguageRange {
  const [tag = "", ...parameters] = range.split(";").map((part) => part.trim());
  const weight = parameters.find((parameter) => parameter.startsWith("q="))?.slice(2);
  const quality = weight === undefined ? 1 : Number(weight);

  return { quality: Number.isFinite(quality) ? quality : 1, tag: tag.toLowerCase() };
}

/**
 * The language of the site that best fits an `Accept-Language` header (RFC 9110 §12.5.4): the
 * ranges by their weight, and in each the lookup of RFC 4647 §3.4, so `de-AT` finds `de`, which
 * is how the site names its languages. Undefined when the header asks for none of them.
 */
export function negotiateLanguage(acceptLanguage: string | null): Language | undefined {
  if (!acceptLanguage) return undefined;

  const ranges = acceptLanguage
    .split(",")
    .map(parseRange)
    .filter(({ quality, tag }) => quality > 0 && tag !== "" && tag !== "*")
    // A stable sort, so ranges of the same weight keep the order the browser gave them.
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranges) {
    const [primary] = tag.split("-");

    if (isLanguage(primary)) return primary;
  }

  return undefined;
}
