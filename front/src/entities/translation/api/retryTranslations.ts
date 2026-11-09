import { http } from "@/shared/api/http";

/** Lifts a halt and sends every text still missing to the translator. */
export function retryTranslations(): Promise<void> {
  return http.postVoid({ path: "/translations/retry" });
}
