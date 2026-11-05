import clsx from "clsx";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import { useClearField } from "@/shared/lib/useClearField";
import { ClearableInput } from "@/shared/ui/clearable-input";

import { contactFields } from "../model/contactFields";
import type { ContactLinksFormValues } from "../model/contactLinksFormSchema";
import styles from "./ContactLinksFields.module.css";

interface ContactLinksFieldsProps {
  className?: string;
  isSaving: boolean;
}

/** The fields of `EditContactLinksForm`; they read the form from its context. */
export function ContactLinksFields({ className, isSaving }: ContactLinksFieldsProps) {
  const { control, register } = useFormContext<ContactLinksFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  const clearField = useClearField<ContactLinksFormValues>();
  const values = useWatch({ control });

  return (
    <div className={clsx(styles.root, className)}>
      {contactFields.map((field) => (
        <ClearableInput
          key={field.name}
          label={field.label}
          hint={field.hint}
          type={field.type}
          autoComplete={field.autoComplete}
          placeholder={field.placeholder}
          spellCheck={false}
          disabled={isSaving}
          error={errors[field.name]?.message}
          isModified={Boolean(dirtyFields[field.name])}
          hasValue={Boolean(values[field.name])}
          clearLabel={`Очистить поле ${field.label}`}
          onClear={() => clearField(field.name)}
          {...register(field.name)}
        />
      ))}
    </div>
  );
}
