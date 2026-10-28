import clsx from "clsx";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import type { Contacts } from "@/entities/contacts";
import { ClearableInput } from "@/shared/ui/clearable-input";

import { contactFields } from "../model/contactFields";
import type { ContactsFormValues } from "../model/contactsFormSchema";
import styles from "./ContactLinksFields.module.css";

interface ContactLinksFieldsProps {
  className?: string;
  isSaving: boolean;
}

/** The links tab of `EditContactsForm`; it reads the form from its context. */
export function ContactLinksFields({ className, isSaving }: ContactLinksFieldsProps) {
  const { control, register, setFocus, setValue } = useFormContext<ContactsFormValues>();
  const { dirtyFields, errors, isSubmitted } = useFormState({ control });
  const values = useWatch({ control });

  function clearField(name: keyof Contacts) {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue(name, "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus(name);
  }

  return (
    <div className={clsx(styles.root, className)}>
      {contactFields.map((field) => (
        <ClearableInput
          key={field.name}
          label={field.label}
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
