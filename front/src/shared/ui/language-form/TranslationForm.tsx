import React from "react";
import { FormProvider } from "react-hook-form";

import {
  getRequestErrorMessage,
  isSessionExpiredError,
  sessionExpiredMessage,
} from "@/shared/api/requestErrorMessages";
import { rightToLeftLanguages, type TargetLanguage } from "@/shared/config/languages";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EditForm } from "@/shared/ui/edit-form";

import styles from "./LanguageForm.module.css";
import { TranslationField } from "./TranslationField";
import { type TranslatedField, useTranslationForm } from "./useTranslationForm";

/** Why the texts on the screen may be behind the server: what is typed stays either way. */
function getReadErrorMessage(error: unknown): string {
  return isSessionExpiredError(error)
    ? sessionExpiredMessage
    : getRequestErrorMessage(error, "Не удалось обновить переводы");
}

interface TranslationFormProps {
  fields: readonly TranslatedField[];
  language: TargetLanguage;
  resource: string;
}

/** The texts of a resource in one language; a person's text is replaced only after asking. */
export function TranslationForm({ fields, language, resource }: TranslationFormProps) {
  const { data, error, form, isSaving, revertTo, submit, translateAnew } = useTranslationForm({
    fields,
    language,
    resource,
  });
  // The text whose replacement by a new translation waits for an answer.
  const [keyToReplace, setKeyToReplace] = React.useState<string>();

  if (error && !data) {
    return <p role="alert">Не удалось загрузить переводы. Обновите страницу</p>;
  }

  if (!data) {
    return null;
  }

  const shown = fields.filter(({ key }) => data.sources[key]);

  if (shown.length === 0) {
    return <p>Переводить пока нечего: сначала сохраните текст на русском</p>;
  }

  return (
    <FormProvider {...form}>
      <EditForm
        hasUnsavedChanges={form.formState.isDirty}
        isSaving={isSaving}
        onRevert={() => revertTo(data)}
        onSubmit={submit}
      >
        {error ? <p role="alert">{getReadErrorMessage(error)}</p> : null}
        <div
          className={styles.fields}
          dir={rightToLeftLanguages.includes(language) ? "rtl" : undefined}
        >
          {shown.map((field) => (
            <TranslationField
              key={field.key}
              failed={data.failed}
              field={field}
              isSaving={isSaving}
              language={language}
              original={data.sources[field.key] ?? ""}
              status={data.translations[language]?.[field.key]?.status}
              onTranslateAnew={(isPersonsText) =>
                isPersonsText ? setKeyToReplace(field.key) : translateAnew(field.key)
              }
            />
          ))}
        </div>
        <ConfirmDialog
          isOpen={keyToReplace !== undefined}
          title="Заменить ручную правку?"
          description="Текст, написанный вручную, будет заменён новым автопереводом."
          cancelLabel="Оставить"
          confirmLabel="Перевести заново"
          onCancel={() => setKeyToReplace(undefined)}
          onConfirm={() => {
            if (keyToReplace !== undefined) translateAnew(keyToReplace);
            setKeyToReplace(undefined);
          }}
        />
      </EditForm>
    </FormProvider>
  );
}
