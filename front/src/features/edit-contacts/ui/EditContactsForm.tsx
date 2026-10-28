import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import React from "react";
import { useForm, useWatch } from "react-hook-form";

import type { Contacts } from "@/entities/contacts";
import { useUnsavedChangesGuard } from "@/shared/lib/useUnsavedChangesGuard";
import { Button } from "@/shared/ui/button";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ArrowLeftIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Spinner } from "@/shared/ui/spinner";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { contactFields } from "../model/contactFields";
import { type ContactsFormValues, contactsFormSchema } from "../model/contactsFormSchema";
import styles from "./EditContactsForm.module.css";

interface EditContactsFormProps {
  className?: string;
  isSaving: boolean;
  onSubmit: (values: ContactsFormValues) => void;
  /** The last saved values. Passing a new object resets the form to it. */
  savedContacts: Contacts;
}

export function EditContactsForm({
  className,
  isSaving,
  onSubmit,
  savedContacts,
}: EditContactsFormProps) {
  const {
    control,
    formState: { dirtyFields, errors, isDirty, isSubmitted },
    handleSubmit,
    register,
    reset,
    setFocus,
    setValue,
  } = useForm<ContactsFormValues>({
    defaultValues: savedContacts,
    resolver: zodResolver(contactsFormSchema),
  });
  const values = useWatch({ control });
  const saveButtonRef = React.useRef<HTMLButtonElement>(null);
  const unsavedChangesGuard = useUnsavedChangesGuard(isDirty);

  // After a successful save the saved values become the new baseline: nothing is modified any more.
  React.useEffect(() => {
    reset(savedContacts);
  }, [reset, savedContacts]);

  function clearField(name: keyof ContactsFormValues) {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue(name, "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus(name);
  }

  function revertChanges() {
    reset();
    // The revert button disappears together with the changes, so the focus moves to its neighbour.
    saveButtonRef.current?.focus();
  }

  return (
    <form className={clsx(styles.root, className)} noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.fields}>
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

      <div className={styles.actions}>
        {isDirty ? (
          <IconButton label="Отменить изменения" disabled={isSaving} onClick={revertChanges}>
            <ArrowLeftIcon />
          </IconButton>
        ) : null}
        <Button
          ref={saveButtonRef}
          className={styles.saveButton}
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
        >
          {isSaving ? (
            <>
              <Spinner />
              <VisuallyHidden>Сохранение</VisuallyHidden>
            </>
          ) : (
            "Сохранить"
          )}
        </Button>
      </div>

      <ConfirmDialog
        isOpen={unsavedChangesGuard.isBlocked}
        title="Уйти без сохранения?"
        description="Несохранённые изменения будут потеряны."
        cancelLabel="Остаться"
        confirmLabel="Уйти"
        onCancel={unsavedChangesGuard.stay}
        onConfirm={unsavedChangesGuard.leave}
      />
    </form>
  );
}
