import { zodResolver } from "@hookform/resolvers/zod";
import type { QueryKey } from "@tanstack/react-query";
import React from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";

import { type GalleryWork, galleryWorksQuery } from "@/entities/gallery";
import type { Tagged } from "@/shared/api/http";
import { useReplaceResource } from "@/shared/api/useReplaceResource";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { EditForm, useSavedForm } from "@/shared/ui/edit-form";

import {
  type TitleListConfig,
  type TitleListFormValues,
  titleListFormSchema,
} from "../model/titleList";
import { useRowRemoval } from "../model/useRowRemoval";
import { describeWorkUsage, noWorkUsage, workUsageById } from "../model/workUsage";
import { AddTitleField } from "./AddTitleField";
import { TitleList } from "./TitleList";
import styles from "./TitleList.module.css";
import { TitleListRow } from "./TitleListRow";

interface EditTitleListFormProps<TData, TQueryKey extends QueryKey> {
  className?: string;
  /** The list as stored on the server when the form opens, with its ETag. */
  data: Tagged<TData>;
  list: TitleListConfig<TData, TQueryKey>;
  /** Every work, to count the works that name each row. */
  works: readonly GalleryWork[];
}

/** The row being renamed: the key of its row and the title the renaming started from. */
interface Editing {
  key: string;
  startTitle: string;
}

/**
 * A list of titles of the gallery, such as the materials: a row is added, renamed or removed here,
 * and «Сохранить» sends the whole list. A row tells how many works name it, and its removal asks
 * first if any do. The site lists the rows by title, and so does the list once
 * it is saved; the rows added since stay at its end until then.
 */
export function EditTitleListForm<TData, TQueryKey extends QueryKey>({
  className,
  data,
  list,
  works,
}: EditTitleListFormProps<TData, TQueryKey>) {
  const { max, texts } = list;
  const schema = React.useMemo(() => titleListFormSchema(list), [list]);
  const toValues = (listData: TData): TitleListFormValues => ({ items: list.toItems(listData) });
  const form = useForm<TitleListFormValues>({
    defaultValues: toValues(data.data),
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
    related: [galleryWorksQuery.queryKey],
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
  const { workIds } = list;
  const usages = React.useMemo(() => workUsageById(works.map(workIds)), [works, workIds]);
  const removal = useRowRemoval({
    remove: (index) => {
      remove(index);
      setEditing(undefined);
    },
    // The row and its buttons are gone; the next row is added from the field above.
    onRemoved: () => addFieldRef.current?.focus(),
  });
  const removedTitle = removal.pending ? rows[removal.pending.index]?.title : undefined;

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
                  workCount={
                    savedTitle === undefined ? undefined : (usages.get(row.id) ?? noWorkUsage).count
                  }
                  onStartEdit={() => setEditing({ key: field.id, startTitle: row.title })}
                  onFinishEdit={() => finishEdit(index)}
                  onCancelEdit={() => cancelEdit(index)}
                  onRemove={() => removal.request(index, usages.get(row.id) ?? noWorkUsage)}
                />
              );
            })}
          </TitleList>
        </div>

        <ConfirmDialog
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
          cancelLabel="Отмена"
          confirmLabel="Удалить"
          onCancel={removal.cancel}
          onConfirm={removal.confirm}
        />
      </EditForm>
    </FormProvider>
  );
}
