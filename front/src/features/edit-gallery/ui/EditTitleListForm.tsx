import { zodResolver } from "@hookform/resolvers/zod";
import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";

import type { Tagged } from "@/shared/api/http";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";

import {
  type TitleListConfig,
  type TitleListFormValues,
  titleListFormSchema,
} from "../model/titleList";
import { AddTitleField } from "./AddTitleField";
import { TitleList } from "./TitleList";
import styles from "./TitleList.module.css";
import { TitleListRow } from "./TitleListRow";

interface EditTitleListFormProps<TData, TQueryKey extends QueryKey> {
  className?: string;
  /** The list as stored on the server when the form opens, with its ETag. */
  data: Tagged<TData>;
  list: TitleListConfig<TData, TQueryKey>;
}

/** The row being renamed: the key of its row and the title the renaming started from. */
interface Editing {
  key: string;
  startTitle: string;
}

/**
 * Saves the whole list, then puts the saved list into the cache: the server returns it sorted,
 * with its ETag, so the page need not load it again.
 */
function useSaveTitleList<TData, TQueryKey extends QueryKey>(
  list: TitleListConfig<TData, TQueryKey>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    meta: { feedback: { getErrorMessage: list.getSaveErrorMessage, toastId: list.toastId } },
    mutationFn: list.replace,
    onSuccess: (saved) => queryClient.setQueryData<Tagged<TData>>(list.query.queryKey, saved),
  });
}

/**
 * A list of titles of the gallery, such as the materials: a row is added, renamed or removed here,
 * and «Сохранить» sends the whole list. The site lists the rows by title, and so does the list once
 * it is saved; the rows added since stay at its end until then.
 */
export function EditTitleListForm<TData, TQueryKey extends QueryKey>({
  className,
  data,
  list,
}: EditTitleListFormProps<TData, TQueryKey>) {
  const { max, texts } = list;
  const schema = React.useMemo(() => titleListFormSchema(list), [list]);
  const toValues = (listData: TData): TitleListFormValues => ({ items: list.toItems(listData) });
  const form = useForm<TitleListFormValues>({
    defaultValues: toValues(data.data),
    resolver: zodResolver(schema),
  });
  const saveList = useSaveTitleList(list);
  const { editForm, saved } = useSavedForm({
    form,
    initial: data,
    query: list.query,
    save: (values, etag) => saveList.mutateAsync({ etag, items: values.items }),
    toValues,
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
  const [editing, setEditing] = React.useState<Editing>();
  const addFieldRef = React.useRef<HTMLInputElement>(null);
  const savedTitles = new Map(list.toItems(saved.data).map(({ id, title }) => [id, title]));

  function finishEdit(index: number) {
    setEditing(undefined);
    // A row with an invalid title stays open until it is fixed.
    void trigger(`items.${index}.title`);
  }

  function cancelEdit(index: number) {
    if (editing) {
      setValue(`items.${index}.title`, editing.startTitle, {
        shouldDirty: true,
        shouldValidate: isSubmitted,
      });
    }
    setEditing(undefined);
  }

  function removeRow(index: number) {
    remove(index);
    setEditing(undefined);
    // The row and its buttons are gone; the next row is added from the field above.
    addFieldRef.current?.focus();
  }

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
                  title={row.title}
                  titleField={register(`items.${index}.title`)}
                  labels={{
                    field: texts.rowField(savedTitle ?? row.title),
                    remove: `Удалить ${row.title || texts.rowFallback}`,
                    edit: `Переименовать ${row.title}`,
                  }}
                  error={titleError}
                  isEditing={editing?.key === field.id || Boolean(titleError)}
                  isNew={savedTitle === undefined}
                  isModified={isTitleModified}
                  isTitleModified={isTitleModified}
                  isSaving={editForm.isSaving}
                  onStartEdit={() => setEditing({ key: field.id, startTitle: row.title })}
                  onFinishEdit={() => finishEdit(index)}
                  onCancelEdit={() => cancelEdit(index)}
                  onRemove={() => removeRow(index)}
                />
              );
            })}
          </TitleList>
        </div>
      </EditForm>
    </FormProvider>
  );
}
