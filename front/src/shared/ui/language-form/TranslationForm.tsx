import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { getRequestErrorMessage } from "@/shared/api/requestErrorMessages";
import {
  patchTranslations,
  type ResourceTranslations,
  translationsQuery,
} from "@/shared/api/translations";
import { rightToLeftLanguages, type TargetLanguage } from "@/shared/config/languages";
import { getTranslationHint } from "@/shared/lib/translationsForm";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { ClearableTextarea } from "@/shared/ui/clearable-textarea";
import { EditForm } from "@/shared/ui/edit-form";

import styles from "./LanguageForm.module.css";

/** A text of a resource that a person can edit in every language. */
export interface TranslatedField {
  /** The name the server gives the text. */
  key: string;
  label: string;
  /** Whether the text takes several lines. */
  multiline?: boolean;
}

/** Mirrors the server rule in backend/src/modules/translations/schema.ts. */
const maxTranslationLength = 4_000;

type TranslationValues = Record<string, string>;

interface TranslationFormProps {
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
 * The texts of a resource in one language, each with the Russian text it translates. A text the
 * translator finishes shows up by itself, unless the person has changed that field: what they type
 * stays. A save sends only what they changed, and an emptied field is translated anew.
 */
export function TranslationForm({ fields, language, resource }: TranslationFormProps) {
  const queryClient = useQueryClient();
  const query = translationsQuery(resource);
  const { data } = useQuery(query);
  const form = useForm<TranslationValues>({
    resetOptions: { keepDirtyValues: true },
    values: data && toValues(data, fields, language),
  });
  const {
    formState: { dirtyFields, errors, isDirty },
    handleSubmit,
    register,
    reset,
    setFocus,
    setValue,
    watch,
  } = form;
  const save = useMutation({
    meta: {
      feedback: {
        getErrorMessage: (error: unknown) =>
          getRequestErrorMessage(error, "Не удалось сохранить перевод"),
        toastId: "translations-save",
      },
    },
    mutationFn: (texts: Record<string, string | null>) =>
      patchTranslations({ language, resource, texts }),
    onSuccess: (saved) => {
      queryClient.setQueryData(query.queryKey, saved);
      reset(toValues(saved, fields, language), { keepDirtyValues: false });
    },
  });

  function submit(values: TranslationValues) {
    const changed = Object.keys(dirtyFields).map((key) => {
      const text = values[key]?.trim() ?? "";

      return [key, text === "" ? null : text] as const;
    });

    if (changed.length > 0) {
      save.mutate(Object.fromEntries(changed));
    }
  }

  if (!data) {
    return null;
  }

  const shown = fields.filter(({ key }) => data.sources[key]);

  return (
    <EditForm
      hasUnsavedChanges={isDirty}
      isSaving={save.isPending}
      onRevert={() => reset(toValues(data, fields, language), { keepDirtyValues: false })}
      onSubmit={handleSubmit(submit)}
    >
      <div
        className={styles.fields}
        dir={rightToLeftLanguages.includes(language) ? "rtl" : undefined}
      >
        {shown.map(({ key, label, multiline = false }) => {
          const Control = multiline ? ClearableTextarea : ClearableInput;
          const text = watch(key) ?? "";

          return (
            <Control
              key={key}
              label={label}
              hint={getTranslationHint({
                failed: data.failed,
                original: data.sources[key] ?? "",
                status: data.translations[language]?.[key]?.status,
                text: text.trim(),
              })}
              disabled={save.isPending}
              error={errors[key]?.message}
              isModified={Boolean(dirtyFields[key])}
              hasValue={Boolean(text)}
              clearLabel="Очистить, чтобы перевести заново"
              onClear={() => {
                setValue(key, "", { shouldDirty: true });
                setFocus(key);
              }}
              {...(multiline ? { rows: 8 } : {})}
              {...register(key, {
                maxLength: {
                  message: `Не длиннее ${String(maxTranslationLength)} символов`,
                  value: maxTranslationLength,
                },
              })}
            />
          );
        })}
      </div>
    </EditForm>
  );
}
