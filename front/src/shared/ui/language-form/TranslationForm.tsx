import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
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
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EditForm } from "@/shared/ui/edit-form";

import styles from "./LanguageForm.module.css";
import { OriginalText } from "./OriginalText";

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
 * The texts of a resource in one language, each with the Russian text it translates, folded away:
 * a description may be long. A text the
 * translator finishes shows up by itself, unless the person has changed that field: what they type
 * stays. A save sends only what they changed; a new translation is asked for by its own button.
 */
export function TranslationForm({ fields, language, resource }: TranslationFormProps) {
  const formId = React.useId();
  // The text whose replacement by a new translation waits for an answer.
  const [keyToReplace, setKeyToReplace] = React.useState<string>();
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
    getFieldState,
    reset,
    resetField,
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
    mutationFn: (texts: Record<string, string>) => patchTranslations({ language, resource, texts }),
    onSuccess: (saved) => {
      queryClient.setQueryData(query.queryKey, saved);
      reset(toValues(saved, fields, language), { keepDirtyValues: false });
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
    onSuccess: (saved, key) => {
      queryClient.setQueryData(query.queryKey, saved);
      resetField(key, { defaultValue: "" });
    },
  });

  function submit(values: TranslationValues) {
    const changed = Object.keys(dirtyFields).map((key) => [key, values[key]?.trim() ?? ""]);

    if (changed.length > 0) {
      save.mutate(Object.fromEntries(changed));
    }
  }

  /** A person's text is theirs: replacing it is asked about first. */
  function requestTranslateAnew(key: string, isPersonsText: boolean) {
    if (isPersonsText) {
      setKeyToReplace(key);
    } else {
      translateAnew.mutate(key);
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
          const statusId = `${formId}-${key}`;
          const status = data.translations[language]?.[key]?.status;
          const isOnItsWay = !data.failed && (status === undefined || status === "pending");

          return (
            <div key={key} className={styles.field}>
              <Control
                label={label}
                aria-describedby={statusId}
                disabled={save.isPending}
                error={errors[key]?.message}
                isModified={Boolean(dirtyFields[key])}
                hasValue={Boolean(text)}
                clearLabel="Очистить"
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
                  // A text still on its way is empty too, and it is not the person's to fill.
                  validate: (value) =>
                    value.trim() !== "" ||
                    !getFieldState(key).isDirty ||
                    "Введите перевод или нажмите «Перевести заново»",
                })}
              />
              <OriginalText
                original={data.sources[key] ?? ""}
                status={getTranslationHint({ failed: data.failed, status, text: text.trim() })}
                statusId={statusId}
                onTranslateAnew={
                  isOnItsWay
                    ? undefined
                    : () => requestTranslateAnew(key, status === "edited" || status === "outdated")
                }
              />
            </div>
          );
        })}
      </div>
      <ConfirmDialog
        isOpen={keyToReplace !== undefined}
        title="Заменить ручную правку?"
        description="Текст, написанный вручную, будет заменён новым автопереводом."
        cancelLabel="Оставить"
        confirmLabel="Перевести заново"
        onCancel={() => setKeyToReplace(undefined)}
        onConfirm={() => {
          if (keyToReplace !== undefined) translateAnew.mutate(keyToReplace);
          setKeyToReplace(undefined);
        }}
      />
    </EditForm>
  );
}
