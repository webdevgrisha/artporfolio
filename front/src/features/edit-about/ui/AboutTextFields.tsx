import clsx from "clsx";
import { useFormContext, useFormState } from "react-hook-form";

import { Textarea } from "@/shared/ui/textarea";
import { aboutTextFields } from "../model/aboutTextFields";
import { type AboutTextFormValues, aboutTextMaxLengths } from "../model/aboutTextFormSchema";
import styles from "./AboutTextFields.module.css";

interface AboutTextFieldsProps {
  className?: string;
  isSaving: boolean;
}

/** The fields of `EditAboutTextForm`; they read the form from its context. */
export function AboutTextFields({ className, isSaving }: AboutTextFieldsProps) {
  const { control, register } = useFormContext<AboutTextFormValues>();
  const { dirtyFields, errors } = useFormState({ control });

  return (
    <div className={clsx(styles.root, className)}>
      {aboutTextFields.map((field) => (
        <Textarea
          key={field.name}
          label={field.label}
          hint={`До ${String(aboutTextMaxLengths[field.name])} символов. Абзацы разделяйте пустой строкой`}
          placeholder={field.placeholder}
          rows={12}
          disabled={isSaving}
          error={errors[field.name]?.message}
          isModified={Boolean(dirtyFields[field.name])}
          {...register(field.name)}
        />
      ))}
    </div>
  );
}
