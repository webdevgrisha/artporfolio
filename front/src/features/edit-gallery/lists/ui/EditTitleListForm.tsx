import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";

import { galleryWorkUsageQuery, type WorkUsages } from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { useReplaceResource } from "@/shared/api/useReplaceResource";
import { useFocusAfterUpdate } from "@/shared/lib/useFocusAfterUpdate";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-dialog";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";
import { useRowRemoval } from "../../model/useRowRemoval";
import { describeWorkUsage, usageOf } from "../../model/workUsage";
import {
  type TitleItem,
  type TitleListConfig,
  type TitleListFormValues,
  titleListFormSchema,
  toTitleListFormValues,
} from "../model/titleList";
import { useRowEditing } from "../model/useRowEditing";
import { AddTitleField } from "./AddTitleField";
import { TitleList } from "./TitleList";
import styles from "./TitleList.module.css";
import { TitleListRow } from "./TitleListRow";

interface EditTitleListFormProps {
  className?: string;
  /** The list as stored on the server when the form opens, with its ETag. */
  data: Tagged<TitleItem[]>;
  list: TitleListConfig;
  /** How many works name each row, by its id. */
  usages: WorkUsages;
}

/**
 * A list of titles of the gallery, such as the materials: a row is added, renamed or removed here,
 * and «Сохранить» sends the whole list. A row tells how many works name it, and its removal asks
 * first if any do. The site lists the rows by title, and so does the list once
 * it is saved; the rows added since stay at its end until then.
 */
export function EditTitleListForm({ className, data, list, usages }: EditTitleListFormProps) {
  const { max, texts } = list;
  const schema = React.useMemo(() => titleListFormSchema(list), [list]);
  const form = useForm<TitleListFormValues>({
    defaultValues: toTitleListFormValues(data.data),
    resolver: zodResolver(schema),
  });
  const saveList = useReplaceResource({
    feedback: { getErrorMessage: list.getSaveErrorMessage, toastId: list.toastId },
    mutationFn: list.replace,
    queryKey: list.query.queryKey,
  });
  const { editForm, saved } = useSavedForm({
    form,
    initial: data,
    query: list.query,
    related: [galleryWorkUsageQuery.queryKey],
    save: (values, etag) => saveList.mutateAsync({ etag, items: values.items }),
    toValues: toTitleListFormValues,
    toastId: list.toastId,
  });
  const {
    control,
    formState: { errors, isSubmitted },
    register,
    setValue,
    trigger,
  } = form;
  // `fields` gives every row a stable key; the values come from `rows`, which also follow typing.
  const { append, fields, remove } = useFieldArray({ control, name: "items" });
  const rows = useWatch({ control, name: "items" });
  const { rowEditing, stopEditing } = useRowEditing<string>({
    restore: (index, startTitle) =>
      setValue(`items.${index}.title`, startTitle, {
        shouldDirty: true,
        shouldValidate: isSubmitted,
      }),
    validate: (index) => void trigger(`items.${index}.title`),
  });
  const addFieldRef = React.useRef<HTMLInputElement>(null);
  const savedTitles = new Map(saved.data.map(({ id, title }) => [id, title]));
  const focusAfterUpdate = useFocusAfterUpdate();
  const removal = useRowRemoval((index) => {
    remove(index);
    stopEditing();
    // The row and its buttons are gone; the next row is added from the field above.
    focusAfterUpdate(() => addFieldRef.current?.focus());
  });
  const removedTitle = removal.pending ? rows[removal.pending.index]?.title : undefined;

  return (
    <FormProvider {...form}>
      <EditForm className={className} {...editForm}>
        <div className={styles.root}>
          <AddTitleField
            ref={addFieldRef}
            disabled={editForm.isSaving}
            existingTitles={rows.map((row) => row.title)}
            labels={{
              add: texts.add,
              duplicate: texts.duplicate,
              field: texts.newItem,
              full: texts.full,
              placeholder: texts.placeholder,
            }}
            max={max}
            onAdd={(title) => append({ id: crypto.randomUUID(), title }, { shouldFocus: false })}
          />

          <TitleList
            heading={texts.heading}
            hint={`${String(fields.length)} из ${String(max)}. На сайте идут по алфавиту`}
            empty={texts.empty}
            error={errors.items?.message ?? errors.items?.root?.message}
            isEmpty={fields.length === 0}
          >
            {fields.map((field, index) => {
              const row = rows[index] ?? field;
              const savedTitle = savedTitles.get(row.id);
              const isTitleModified = savedTitle !== row.title;
              const titleError = errors.items?.[index]?.title?.message;

              return (
                <TitleListRow
                  key={field.id}
                  row={{
                    isNew: savedTitle === undefined,
                    title: row.title,
                    workCount: savedTitle === undefined ? undefined : usageOf(usages, row.id).count,
                  }}
                  titleField={register(`items.${index}.title`)}
                  labels={{
                    field: texts.rowField(savedTitle ?? row.title),
                    remove: `Удалить ${row.title || texts.rowFallback}`,
                    edit: `Переименовать ${row.title}`,
                  }}
                  editing={rowEditing(field.id, index, row.title, Boolean(titleError))}
                  error={titleError}
                  isModified={isTitleModified}
                  isTitleModified={isTitleModified}
                  isSaving={editForm.isSaving}
                  onRemove={() => removal.request(index, usageOf(usages, row.id))}
                />
              );
            })}
          </TitleList>
        </div>

        <ConfirmDeleteDialog
          isOpen={removal.pending !== undefined}
          title={`Удалить ${texts.rowFallback} «${removedTitle ?? ""}»?`}
          description={
            removal.pending
              ? describeWorkUsage(removal.pending.usage, {
                  item: texts.rowFallback,
                  others: texts.others,
                })
              : ""
          }
          onCancel={removal.cancel}
          onConfirm={removal.confirm}
        />
      </EditForm>
    </FormProvider>
  );
}
