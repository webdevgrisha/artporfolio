import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getRequestErrorMessage } from "@/shared/api/requestErrorMessages";
import {
  retryTranslations,
  type TranslationState,
  translationStateQuery,
} from "@/shared/api/translations";
import { Button } from "@/shared/ui/button";

import styles from "./TranslationBanner.module.css";

/** From this share of the plan on, the admin is told to renew it in time. */
const warningShare = 0.9;

const haltMessages: Record<NonNullable<TranslationState["halted"]>, string> = {
  key: "DeepL не принимает ключ, поэтому новые тексты не переводятся. Проверьте ключ, затем нажмите «Повторить перевод».",
  limit:
    "Закончился лимит переводов. Новые тексты не переводятся. Обновите тариф DeepL, затем нажмите «Повторить перевод».",
  paused: "Перевод приостановлен. Новые тексты не переводятся.",
};

function isNearLimit({ usage }: TranslationState): boolean {
  return usage !== null && usage.limit > 0 && usage.used / usage.limit >= warningShare;
}

/** Tells the admin when translating stopped or is about to, on every page of the admin. */
export function TranslationBanner() {
  const queryClient = useQueryClient();
  const { data } = useQuery(translationStateQuery);
  const retry = useMutation({
    meta: {
      feedback: {
        getErrorMessage: (error: unknown) =>
          getRequestErrorMessage(error, "Не удалось запустить перевод"),
        toastId: "translations-retry",
      },
    },
    mutationFn: retryTranslations,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: translationStateQuery.queryKey }),
  });

  if (!data) {
    return null;
  }

  if (data.halted !== null) {
    return (
      <div className={styles.root} role="alert">
        <p className={styles.text}>{haltMessages[data.halted]}</p>
        <Button disabled={retry.isPending} onClick={() => retry.mutate()}>
          Повторить перевод
        </Button>
      </div>
    );
  }

  if (isNearLimit(data)) {
    return (
      <div className={styles.root} role="status">
        <p className={styles.text}>
          Использовано 90% лимита переводов. Обновите тариф DeepL, пока перевод не остановился.
        </p>
      </div>
    );
  }

  return null;
}
