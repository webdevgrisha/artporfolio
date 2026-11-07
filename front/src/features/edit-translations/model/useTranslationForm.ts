import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import {
  patchTranslations,
  type ResourceTranslations,
  type TranslatedField,
  type TranslationEdit,
  translationsQuery,
} from "@/entities/translation";
import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import type { TargetLanguage } from "@/shared/config/languages";
import { savedMessage, showSuccessToast } from "@/shared/ui/toast";

import { useWrittenFrom } from "./useWrittenFrom";

export type TranslationValues = Record<string, string>;

/** The toasts of the translations replace each other: a later result replaces an error. */
const toastId = "translations-save";

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
  const { data, error } = useQuery(query);
  const form = useForm<TranslationValues>({
    resetOptions: { keepDirtyValues: true },
    values: data && toValues(data, fields, language),
  });
  const { dirtyFields } = form.formState;
  const writtenFrom = useWrittenFrom(data?.sources, dirtyFields);

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
          getSaveErrorMessage(error, { fallback: "Не удалось сохранить перевод" }),
        toastId,
      },
    },
    mutationFn: (texts: Record<string, TranslationEdit>) =>
      patchTranslations({ language, resource, texts }),
    onSuccess: async (saved) => {
      await showSaved(saved);
      revertTo(saved);
    },
  });
  const translateAnew = useMutation({
    meta: {
      feedback: {
        getErrorMessage: (error: unknown) =>
          getSaveErrorMessage(error, { fallback: "Не удалось запустить перевод" }),
        toastId,
      },
    },
    mutationFn: (key: string) => patchTranslations({ language, resource, texts: { [key]: null } }),
    onSuccess: async (saved, key) => {
      await showSaved(saved);
      // The old text stays until the new one comes.
      form.resetField(key, { defaultValue: saved.translations[language]?.[key]?.text ?? "" });
    },
  });

  function submit(values: TranslationValues) {
    // A row deleted in Russian leaves its field behind: the server has no such text any more.
    const changed = Object.keys(dirtyFields)
      .filter((key) => data?.sources[key])
      .map((key) => [key, { source: writtenFrom(key), text: values[key]?.trim() ?? "" }]);

    if (changed.length > 0) {
      save.mutate(Object.fromEntries(changed));
    } else {
      if (data) revertTo(data);
      showSuccessToast(savedMessage, { id: toastId });
    }
  }

  return {
    data,
    error,
    form,
    isSaving: save.isPending || translateAnew.isPending,
    revertTo,
    submit: form.handleSubmit(submit),
    translateAnew: translateAnew.mutate,
  };
}
