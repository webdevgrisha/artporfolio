import {
  type FieldPath,
  type FieldValues,
  type PathValue,
  useFormContext,
  useFormState,
} from "react-hook-form";

/**
 * Empties a text field of the form in its context and gives it the focus: the clear button goes
 * away with the value.
 */
export function useClearField<TValues extends FieldValues>() {
  const { control, setFocus, setValue } = useFormContext<TValues>();
  const { isSubmitted } = useFormState({ control });

  return function clearField(name: FieldPath<TValues>) {
    // After the first submit, fields are revalidated on change; clearing is a change too.
    setValue(name, "" as PathValue<TValues, typeof name>, {
      shouldDirty: true,
      shouldValidate: isSubmitted,
    });
    setFocus(name);
  };
}
