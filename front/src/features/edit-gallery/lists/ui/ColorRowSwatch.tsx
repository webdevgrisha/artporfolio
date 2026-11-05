import { Controller, useFormContext } from "react-hook-form";

import { ColorSwatch, ColorSwatchInput } from "@/shared/ui/color-swatch";
import { Tooltip } from "@/shared/ui/tooltip";

import type { ColorsFormValues } from "../model/colorsFormSchema";

interface ColorRowSwatchProps {
  disabled: boolean;
  hex: string;
  index: number;
  isEditing: boolean;
  label: string;
}

/** The swatch of a color; it changes after the pencil, as the title does. */
export function ColorRowSwatch({ disabled, hex, index, isEditing, label }: ColorRowSwatchProps) {
  const { control } = useFormContext<ColorsFormValues>();

  if (!isEditing) return <ColorSwatch hex={hex} />;

  return (
    <Tooltip content={label}>
      {/* Controlled: an uncontrolled color input shows #000000 before the form fills it, and the
          form would take that for a value the user picked. */}
      <Controller
        control={control}
        name={`colors.${index}.hex`}
        render={({ field }) => <ColorSwatchInput {...field} label={label} disabled={disabled} />}
      />
    </Tooltip>
  );
}
