import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import React from "react";
import { flushSync } from "react-dom";
import { type FieldErrors, useForm, useWatch } from "react-hook-form";

import type { ContactsWithPhoto } from "@/entities/contacts";
import { useUnsavedChangesGuard } from "@/shared/lib/useUnsavedChangesGuard";
import { Button } from "@/shared/ui/button";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { ArrowLeftIcon } from "@/shared/ui/icon";
import { IconButton } from "@/shared/ui/icon-button";
import { Input } from "@/shared/ui/input";
import { type MediaItem, MediaPicker } from "@/shared/ui/media-picker";
import { Spinner } from "@/shared/ui/spinner";
import { Tab, TabList, TabPanel, Tabs } from "@/shared/ui/tabs";
import { Tooltip } from "@/shared/ui/tooltip";
import { VisuallyHidden } from "@/shared/ui/visually-hidden";

import { contactFields } from "../model/contactFields";
import type { ContactsChanges } from "../model/contactsChanges";
import {
  type ContactsFormValues,
  contactsFormSchema,
  savedPhoto,
} from "../model/contactsFormSchema";
import { toContactsFormValues } from "../model/contactsFormValues";
import { getContactsChanges } from "../model/getContactsChanges";
import { photoRules } from "../model/photoRules";
import styles from "./EditContactsForm.module.css";

const revertLabel = "Отменить изменения";

type ContactsTab = "links" | "photo";

/** The fields that can be invalid, in display order, with the tab that shows each of them. */
const validatedFields: readonly (readonly [keyof ContactsFormValues, ContactsTab])[] = [
  ...contactFields.map((field) => [field.name, "links"] as const),
  ["photoAlt", "photo"],
];

interface EditContactsFormProps {
  className?: string;
  isSaving: boolean;
  onSubmit: (changes: ContactsChanges) => void;
  /**
   * The last saved values. A save replaces only the parts it saved, so the form resets only the
   * fields of a part whose object changed and keeps the unsaved changes of a part that failed.
   */
  savedContacts: ContactsWithPhoto;
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
    resetField,
    setFocus,
    setValue,
  } = useForm<ContactsFormValues>({
    defaultValues: toContactsFormValues(savedContacts),
    resolver: zodResolver(contactsFormSchema),
    // A field on a hidden tab cannot take the focus: handleInvalid shows its tab first.
    shouldFocusError: false,
  });
  const values = useWatch({ control });
  const photo = useWatch({ control, name: "photo" });
  const [tab, setTab] = React.useState<ContactsTab>("links");
  const saveButtonRef = React.useRef<HTMLButtonElement>(null);
  const previousSavedRef = React.useRef(savedContacts);
  const unsavedChangesGuard = useUnsavedChangesGuard(isDirty);

  // What was saved becomes the new baseline of its fields: they are no longer modified.
  React.useEffect(() => {
    const previousSaved = previousSavedRef.current;
    previousSavedRef.current = savedContacts;
    const savedValues = toContactsFormValues(savedContacts);

    if (savedContacts.contacts !== previousSaved.contacts) {
      for (const field of contactFields) {
        resetField(field.name, { defaultValue: savedValues[field.name] });
      }
    }

    if (savedContacts.photo !== previousSaved.photo) {
      resetField("photo", { defaultValue: savedValues.photo });
      resetField("photoAlt", { defaultValue: savedValues.photoAlt });
    }
  }, [resetField, savedContacts]);

  const photoItems = React.useMemo((): MediaItem[] => {
    if (photo instanceof File) {
      return [{ id: "picked", name: photo.name, size: photo.size, source: photo }];
    }

    const saved = savedContacts.photo;
    const preview = saved?.sources.webp[0];
    if (photo !== savedPhoto || !saved || !preview) return [];

    // The smallest image is wider than the preview.
    return [{ id: saved.version, name: saved.fileName, size: saved.fileSize, source: preview.url }];
  }, [photo, savedContacts.photo]);

  function clearField(name: (typeof contactFields)[number]["name"]) {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue(name, "", { shouldDirty: true, shouldValidate: isSubmitted });
    setFocus(name);
  }

  function setPhoto(value: ContactsFormValues["photo"]) {
    setValue("photo", value, { shouldDirty: true, shouldValidate: isSubmitted });
  }

  function revertChanges() {
    reset();
    // The revert button disappears together with the changes, so the focus moves to its neighbour.
    saveButtonRef.current?.focus();
  }

  function submitChanges(submittedValues: ContactsFormValues) {
    onSubmit(getContactsChanges(submittedValues, dirtyFields, savedContacts));
  }

  function handleInvalid(fieldErrors: FieldErrors<ContactsFormValues>) {
    const firstInvalid = validatedFields.find(([name]) => fieldErrors[name]);
    if (!firstInvalid) return;

    const [name, fieldTab] = firstInvalid;
    // The tab is rendered synchronously, so its field can take the focus right away.
    flushSync(() => setTab(fieldTab));
    setFocus(name);
  }

  return (
    <form
      className={clsx(styles.root, className)}
      noValidate
      onSubmit={handleSubmit(submitChanges, handleInvalid)}
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabList label="Разделы контактов">
          <Tab value="links">Соц. сети</Tab>
          <Tab value="photo">Фото</Tab>
        </TabList>

        <TabPanel className={styles.links} value="links">
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
        </TabPanel>

        <TabPanel className={styles.photo} value="photo">
          <MediaPicker
            className={styles.photoPicker}
            label="Фото"
            accept={photoRules.accept}
            acceptLabel={photoRules.acceptLabel}
            maxFileSize={photoRules.maxFileSize}
            items={photoItems}
            disabled={isSaving}
            isModified={photo !== (savedContacts.photo ? savedPhoto : null)}
            onAdd={([file]) => setPhoto(file ?? null)}
            onRemove={() => setPhoto(null)}
          />
          {/* Without a photo there is nothing to describe; the text comes back with the photo. */}
          {photo === null ? null : (
            <Input
              label="Описание фото"
              placeholder="Что на фото: для незрячих и поисковиков"
              disabled={isSaving}
              error={errors.photoAlt?.message}
              isModified={Boolean(dirtyFields.photoAlt)}
              {...register("photoAlt")}
            />
          )}
        </TabPanel>
      </Tabs>

      <div className={styles.actions}>
        {isDirty ? (
          <Tooltip content={revertLabel}>
            <IconButton label={revertLabel} disabled={isSaving} onClick={revertChanges}>
              <ArrowLeftIcon />
            </IconButton>
          </Tooltip>
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
