import clsx from "clsx";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import { maxWorkProcessPhotos } from "@/entities/gallery";
import type { ListPhoto, Photo } from "@/shared/api/photo";
import { useClearField } from "@/shared/lib/useClearField";
import { ClearableInput } from "@/shared/ui/clearable-input";
import { PhotoFields } from "@/shared/ui/photo-fields";
import { PhotoListField } from "@/shared/ui/photo-list-field";
import { Textarea } from "@/shared/ui/textarea";

import type { WorkReferences } from "../model/useWorkReferences";
import { type WorkFormValues, workMaxLengths } from "../model/workFormSchema";
import { WorkFieldGroup } from "./WorkFieldGroup";
import styles from "./WorkFields.module.css";
import { WorkFormatFields } from "./WorkFormatFields";
import { WorkPlacementFields } from "./WorkPlacementFields";
import { WorkSaleFields } from "./WorkSaleFields";
import { WorkSearchFields } from "./WorkSearchFields";

interface WorkFieldsProps {
  className?: string;
  isSaving: boolean;
  /** The photo of the saved work, shown while the photo field keeps it; none for a new work. */
  savedPhoto: Photo | null;
  /** The process photos of the saved work, to show that some were removed or moved. */
  savedProcessPhotos: readonly ListPhoto[];
  /** The lists of the gallery to choose from. */
  references: WorkReferences;
}

/** The fields of a work form; they read the form from its context. */
export function WorkFields({
  className,
  isSaving,
  references: { collections, colors, materials, palettes, rates, sections },
  savedPhoto,
  savedProcessPhotos,
}: WorkFieldsProps) {
  const { control, register } = useFormContext<WorkFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  const clearField = useClearField<WorkFormValues>();
  const title = useWatch({ control, name: "title" });
  // After a refused submit, react-hook-form focuses the first invalid field in the order the
  // fields were registered. The groups below render, and so register, in the order of the form;
  // the picker of the work photo takes no focus.
  const titleField = register("title");
  const descriptionField = register("description");

  // The fields in groups under headings, in one column: a form is read and filled top to bottom.
  return (
    <div className={clsx(styles.root, className)}>
      <WorkFieldGroup title="Работа">
        <PhotoFields label="Фото работы" isSaving={isSaving} serverPhoto={savedPhoto} />
        <ClearableInput
          label="Название"
          hint={`До ${String(workMaxLengths.title)} символов`}
          placeholder="Например: Слон на закате"
          disabled={isSaving}
          error={errors.title?.message}
          isModified={Boolean(dirtyFields.title)}
          hasValue={Boolean(title)}
          clearLabel="Очистить название"
          onClear={() => clearField("title")}
          {...titleField}
        />
        <Textarea
          label="Описание"
          hint={`До ${String(workMaxLengths.description)} символов. Абзацы разделяйте пустой строкой`}
          placeholder="О чём работа и как она сделана"
          rows={8}
          disabled={isSaving}
          error={errors.description?.message}
          isModified={Boolean(dirtyFields.description)}
          {...descriptionField}
        />
      </WorkFieldGroup>

      <WorkFieldGroup title="Формат и размер">
        <WorkFormatFields isSaving={isSaving} />
      </WorkFieldGroup>

      <WorkFieldGroup title="Где показывать">
        <WorkPlacementFields collections={collections} isSaving={isSaving} sections={sections} />
      </WorkFieldGroup>

      <WorkFieldGroup title="Для поиска на сайте">
        <WorkSearchFields
          colors={colors}
          isSaving={isSaving}
          materials={materials}
          palettes={palettes}
        />
      </WorkFieldGroup>

      <WorkFieldGroup title="Продажа">
        <WorkSaleFields isSaving={isSaving} rates={rates} />
      </WorkFieldGroup>

      <WorkFieldGroup title="Процесс">
        <PhotoListField
          label="Фото процесса"
          altPlaceholder="Например: первые наброски карандашом"
          maxPhotos={maxWorkProcessPhotos}
          isSaving={isSaving}
          savedPhotos={savedProcessPhotos}
        />
      </WorkFieldGroup>
    </div>
  );
}
