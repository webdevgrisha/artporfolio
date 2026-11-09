import type { z } from "zod";

import { maxWorkSetSize, minWorkSetSize, type WorkFormat } from "@/entities/gallery";

import { discountError, priceError } from "./workPriceInput";

/** Whether the month has not come yet; read when the form is checked. */
function isFutureMonth(year: number, month: number): boolean {
  const now = new Date();

  return year === now.getFullYear() && month > now.getMonth() + 1;
}

/**
 * Rejects a month to come in this year. A year to come has its own error, and the month is checked
 * only once both fields hold a value.
 */
export function refineMonth(
  { month, year }: { month: string; year: string },
  context: z.RefinementCtx,
): void {
  if (/^\d{4}$/.test(year.trim()) && month && isFutureMonth(Number(year), Number(month))) {
    context.addIssue({ code: "custom", message: "Этот месяц ещё не наступил", path: ["month"] });
  }
}

/** What is wrong with the count of works of a set as typed, or null when it is a valid count. */
function partCountError(text: string): string | null {
  if (text === "") {
    return "Введите количество";
  }

  if (!/^\d+$/.test(text)) {
    return "Введите целое число";
  }

  const count = Number(text);

  return count < minWorkSetSize || count > maxWorkSetSize
    ? `От ${String(minWorkSetSize)} до ${String(maxWorkSetSize)}`
    : null;
}

/**
 * Checks the count of works of a set, which only a set has: while another format is chosen, the
 * field is hidden and its text is kept but not checked.
 */
export function refinePartCount(
  { format, partCount }: { format: WorkFormat; partCount: string },
  context: z.RefinementCtx,
): void {
  const message = format === "set" ? partCountError(partCount.trim()) : null;

  if (message !== null) {
    context.addIssue({ code: "custom", message, path: ["partCount"] });
  }
}

/** Checks the price and the discount, which may both be empty: a work may have no price. */
export function refinePrice(
  { discountPercent, price }: { discountPercent: string; price: string },
  context: z.RefinementCtx,
): void {
  const priceMessage = priceError(price);
  const discountMessage = discountError(discountPercent, price);

  if (priceMessage !== null) {
    context.addIssue({ code: "custom", message: priceMessage, path: ["price"] });
  }

  if (discountMessage !== null) {
    context.addIssue({ code: "custom", message: discountMessage, path: ["discountPercent"] });
  }
}
