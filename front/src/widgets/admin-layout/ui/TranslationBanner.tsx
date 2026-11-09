import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";

import {
  allTranslationsKey,
  retryTranslations,
  type TranslationState,
  translationStateQuery,
} from "@/entities/translation";
import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { Button } from "@/shared/ui/button";

import styles from "./TranslationBanner.module.css";

/** From this percent of the plan on, the admin is told to renew it in time. */
const warningPercent = 90;

const haltMessages: Record<NonNullable<TranslationState["halted"]>, string> = {
  key: "DeepL не принимает ключ, поэтому новые тексты не переводятся. Проверьте ключ, затем нажмите «Повторить перевод».",
  limit:
    "Закончился лимит переводов. Новые тексты не переводятся. Обновите тариф DeepL, затем нажмите «Повторить перевод».",
  paused: "Перевод приостановлен. Новые тексты не переводятся.",
};

function isNearLimit({ usage }: TranslationState): boolean {
  return usage !== null && usage.limit > 0 && (usage.used / usage.limit) * 100 >= warningPercent;
}

interface TranslationBannerProps {
  className?: string;
}

/** Tells the admin when translating stopped or is about to, on every page of the admin. */
export function TranslationBanner({ className }: TranslationBannerProps) {
  const queryClient = useQueryClient();
  const { data } = useQuery(translationStateQuery);
  const retry = useMutation({
    meta: {
      feedback: {
        getErrorMessage: (error: unknown) =>
          getSaveErrorMessage(error, { fallback: "Не удалось запустить перевод" }),
        toastId: "translations-retry",
      },
    },
    mutationFn: retryTranslations,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: translationStateQuery.queryKey }),
        // An open form still shows the texts as failed, and only a new read starts it asking again.
        queryClient.invalidateQueries({ queryKey: allTranslationsKey }),
      ]),
  });

  if (!data) {
    return null;
  }

  if (data.halted !== null) {
    return (
      <div className={clsx(styles.root, className)} role="alert">
        <p className={styles.text}>{haltMessages[data.halted]}</p>
        <Button disabled={retry.isPending} onClick={() => retry.mutate()}>
          Повторить перевод
        </Button>
      </div>
    );
  }

  if (isNearLimit(data)) {
    return (
      <div className={clsx(styles.root, className)} role="status">
        <p className={styles.text}>
          Использовано {warningPercent}% лимита переводов. Обновите тариф DeepL, пока перевод не
          остановился.
        </p>
      </div>
    );
  }

  return null;
}
