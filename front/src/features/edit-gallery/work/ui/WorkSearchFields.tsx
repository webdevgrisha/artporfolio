import React from "react";
import { useController, useFormContext, useFormState } from "react-hook-form";

import { maxWorkColors, maxWorkMaterials, maxWorkPalettes } from "@/entities/gallery";
import { ColorSwatch } from "@/shared/ui/color-swatch";
import { MultiSelect } from "@/shared/ui/multi-select";

import { toIdSet } from "../../model/idSet";
import type { WorkReferences } from "../model/useWorkReferences";
import type { WorkFormValues } from "../model/workFormSchema";
import { toTitleOptions } from "../model/workReferences";

interface WorkSearchFieldsProps {
  colors: WorkReferences["colors"];
  isSaving: boolean;
  materials: WorkReferences["materials"];
  palettes: WorkReferences["palettes"];
}

/** What a visitor finds the work by: its materials, colors and palettes. */
export function WorkSearchFields({ colors, isSaving, materials, palettes }: WorkSearchFieldsProps) {
  const { control } = useFormContext<WorkFormValues>();
  const { dirtyFields, errors } = useFormState({ control });
  const { field: materialsField } = useController({ control, name: "materialIds" });
  const { field: colorsField } = useController({ control, name: "colorIds" });
  const { field: palettesField } = useController({ control, name: "paletteIds" });
  const materialOptions = React.useMemo(() => toTitleOptions(materials), [materials]);
  const colorOptions = React.useMemo(
    () =>
      colors.map(({ hex, id, title }) => ({
        icon: <ColorSwatch hex={hex} variant="text" />,
        label: title,
        value: id,
      })),
    [colors],
  );
  const paletteOptions = React.useMemo(() => toTitleOptions(palettes), [palettes]);

  return (
    <>
      <MultiSelect
        label="Материалы"
        hint={`До ${String(maxWorkMaterials)}`}
        placeholder="Например: масло"
        options={materialOptions}
        value={materialsField.value}
        disabled={isSaving}
        error={errors.materialIds?.message}
        isModified={Boolean(dirtyFields.materialIds)}
        inputRef={materialsField.ref}
        onBlur={materialsField.onBlur}
        onChange={(ids) => materialsField.onChange(toIdSet(ids))}
      />
      <MultiSelect
        label="Цвета"
        hint={`До ${String(maxWorkColors)}`}
        placeholder="Например: синий"
        options={colorOptions}
        value={colorsField.value}
        disabled={isSaving}
        error={errors.colorIds?.message}
        isModified={Boolean(dirtyFields.colorIds)}
        inputRef={colorsField.ref}
        onBlur={colorsField.onBlur}
        onChange={(ids) => colorsField.onChange(toIdSet(ids))}
      />
      <MultiSelect
        label="Палитры"
        hint={`До ${String(maxWorkPalettes)}. Как работа окрашена в целом`}
        placeholder="Например: пастельная"
        options={paletteOptions}
        value={palettesField.value}
        disabled={isSaving}
        error={errors.paletteIds?.message}
        isModified={Boolean(dirtyFields.paletteIds)}
        inputRef={palettesField.ref}
        onBlur={palettesField.onBlur}
        onChange={(ids) => palettesField.onChange(toIdSet(ids))}
      />
    </>
  );
}
