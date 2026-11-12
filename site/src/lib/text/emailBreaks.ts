/**
 * An email address in the pieces a line may break between, as typesetting breaks one: after the
 * @ and before a dot, so each line still reads as part of an address and none starts with the @.
 * Joined, the pieces are the address; a break between them is a <wbr>, which a copy leaves out.
 */
export function emailBreaks(address: string): string[] {
  return address.split(/(?<=@)|(?=\.)/u);
}
