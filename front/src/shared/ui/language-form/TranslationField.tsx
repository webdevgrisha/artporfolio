import React from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import type { TranslationStatus } from "@/shared/api/translations";
import type { TargetLanguage } from "@/shared/config/languages";
import { getTranslationHint } from "@/shared/lib/translationsForm";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { Textarea } from "@/shared/ui/textarea";

import styles from "./LanguageForm.module.css";
import { OriginalText } from "./OriginalText";
import type { TranslatedField, TranslationValues } from "./useTranslationForm";

/** Mirrors the server rule in backend/src/modules/translations/schema.ts. */
const maxTranslationLength = 4_000;

interface TranslationFieldProps {
  /** Whether the server gave up on the texts still missing. */
  failed: boolean;
  field: TranslatedField;
  isSaving: boolean;
  language: TargetLanguage;
  /** Asks for a new translation; `isPersonsText` tells that a person's text would be replaced. */
  onTranslateAnew: (isPersonsText: boolean) => void;
  /** The Russian text as last saved. */
  original: string;
  /** Of the saved translation; undefined when there is none. */
  status: TranslationStatus | undefined;
}

/** One text of a form of a language: reads the form from its context. */
export function TranslationField({
  failed,
  field: { key, label, multiline = false },
  isSaving,
  language,
  onTranslateAnew,
  original,
  status,
}: TranslationFieldProps) {
  const statusId = React.useId();
  const { control, getFieldState, register, setFocus, setValue } =
    useFormContext<TranslationValues>();
  const { dirtyFields, errors } = useFormState({ control });
  const text = useWatch({ control, name: key }) ?? "";
  const isOnItsWay = !failed && (status === undefined || status === "pending");
  const controlProps = {
    "aria-describedby": statusId,
    disabled: isSaving,
    error: errors[key]?.message,
    isModified: Boolean(dirtyFields[key]),
    label,
    lang: language,
    ...register(key, {
      maxLength: {
        message: `Не длиннее ${String(maxTranslationLength)} символов`,
        value: maxTranslationLength,
      },
      // A text still on its way is empty too, and it is not the person's to fill.
      validate: (value) =>
        value.trim() !== "" ||
        !getFieldState(key).isDirty ||
        "Введите перевод или нажмите «Перевести заново»",
    }),
  };

  return (
    <div className={styles.field}>
      {multiline ? (
        <Textarea rows={8} {...controlProps} />
      ) : (
        <ClearableInput
          hasValue={Boolean(text)}
          clearLabel="Очистить"
          onClear={() => {
            setValue(key, "", { shouldDirty: true });
            setFocus(key);
          }}
          {...controlProps}
        />
      )}
      <OriginalText
        original={original}
        status={getTranslationHint({ failed, status, text: text.trim() })}
        statusId={statusId}
        onTranslateAnew={
          isOnItsWay
            ? undefined
            : () => onTranslateAnew(status === "edited" || status === "outdated")
        }
      />
    </div>
  );
}
