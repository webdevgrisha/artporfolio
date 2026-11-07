import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { getRequestErrorMessage } from "@/shared/api/requestErrorMessages";
import {
  patchTranslations,
  type ResourceTranslations,
  translationsQuery,
} from "@/shared/api/translations";
import type { TargetLanguage } from "@/shared/config/languages";

/** A text of a resource that a person can edit in every language. */
export interface TranslatedField {
  /** The name the server gives the text. */
  key: string;
  label: string;
  /** Whether the text takes several lines. */
  multiline?: boolean;
}

export type TranslationValues = Record<string, string>;

interface UseTranslationFormParams {
  fields: readonly TranslatedField[];
  language: TargetLanguage;
  resource: string;
}

function toValues(
  { translations }: ResourceTranslations,
  fields: readonly TranslatedField[],
  language: TargetLanguage,
): TranslationValues {
  return Object.fromEntries(
    fields.map(({ key }) => [key, translations[language]?.[key]?.text ?? ""]),
  );
}

/**
 * The form of one language. A text the translator finishes shows up by itself, unless the person
 * has changed that field: what they type stays. A save sends only what they changed.
 */
export function useTranslationForm({ fields, language, resource }: UseTranslationFormParams) {
  const queryClient = useQueryClient();
  const query = translationsQuery(resource);
  const { data, isError } = useQuery(query);
  const form = useForm<TranslationValues>({
    resetOptions: { keepDirtyValues: true },
    values: data && toValues(data, fields, language),
  });
  const { dirtyFields } = form.formState;

  function revertTo(translations: ResourceTranslations) {
    form.reset(toValues(translations, fields, language), { keepDirtyValues: false });
  }

  async function showSaved(saved: ResourceTranslations) {
    // A read begun before the change would otherwise bring the old texts back when it ends.
    await queryClient.cancelQueries({ queryKey: query.queryKey });
    queryClient.setQueryData(query.queryKey, saved);
  }

  const save = useMutation({
    meta: {
      feedback: {
        getErrorMessage: (error: unknown) =>
          getRequestErrorMessage(error, "Не удалось сохранить перевод"),
        toastId: "translations-save",
      },
    },
    mutationFn: (texts: TranslationValues) => patchTranslations({ language, resource, texts }),
    onSuccess: async (saved) => {
      await showSaved(saved);
      revertTo(saved);
    },
  });
  const translateAnew = useMutation({
    meta: {
      feedback: {
        getErrorMessage: (error: unknown) =>
          getRequestErrorMessage(error, "Не удалось запустить перевод"),
        toastId: "translations-save",
      },
    },
    mutationFn: (key: string) => patchTranslations({ language, resource, texts: { [key]: null } }),
    onSuccess: async (saved, key) => {
      await showSaved(saved);
      form.resetField(key, { defaultValue: "" });
    },
  });

  function submit(values: TranslationValues) {
    // A row deleted in Russian leaves its field behind: the server has no such text any more.
    const changed = Object.keys(dirtyFields)
      .filter((key) => data?.sources[key])
      .map((key) => [key, values[key]?.trim() ?? ""]);

    if (changed.length > 0) {
      save.mutate(Object.fromEntries(changed));
    } else if (data) {
      revertTo(data);
    }
  }

  return {
    data,
    form,
    isError,
    isSaving: save.isPending || translateAnew.isPending,
    revertTo,
    submit: form.handleSubmit(submit),
    translateAnew: translateAnew.mutate,
  };
}
