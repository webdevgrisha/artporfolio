import clsx from "clsx";
import React from "react";

import type { GallerySection } from "@/entities/gallery";
import { Checkbox } from "@/shared/ui/checkbox";
import { FieldError, FieldHint, useFieldIds } from "@/shared/ui/field";
import { ChevronRightIcon } from "@/shared/ui/icon";

import styles from "./SectionsField.module.css";

interface SectionsFieldProps {
  disabled: boolean;
  error?: string;
  /** Takes the first checkbox, so the form can focus the field when it has an error. */
  inputRef: React.Ref<HTMLInputElement>;
  onBlur: () => void;
  /** Gets the chosen ids in the order they were chosen. */
  onChange: (ids: string[]) => void;
  /** The ids the form started with, to highlight the checkboxes that differ from them. */
  savedIds: readonly string[];
  /** The sections of the gallery, sorted by title, each followed by its subsections. */
  sections: readonly GallerySection[];
  /** The chosen sections and subsections, by id. */
  value: readonly string[];
}

/**
 * The sections a work is in, as a list of checkboxes in a frame, after the mockup: a section with
 * subsections opens them under itself. A section opens by itself when one of its subsections is
 * chosen, so every choice is in sight.
 */
export function SectionsField({
  disabled,
  error,
  inputRef,
  onBlur,
  onChange,
  savedIds,
  sections,
  value,
}: SectionsFieldProps) {
  const hint = "Работа в подразделе видна и в его разделе";
  const { controlId, describedBy, errorId, hintId } = useFieldIds({ error, hint });
  const [expandedIds, setExpandedIds] = React.useState<ReadonlySet<string>>(
    () =>
      new Set(
        sections
          .filter((section) =>
            section.subsections.some((subsection) => value.includes(subsection.id)),
          )
          .map((section) => section.id),
      ),
  );
  const firstId = sections[0]?.id;

  function toggleExpanded(sectionId: string) {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (!next.delete(sectionId)) next.add(sectionId);

      return next;
    });
  }

  function checkboxProps(id: string): React.ComponentProps<typeof Checkbox> {
    return {
      checked: value.includes(id),
      disabled,
      hasError: Boolean(error),
      id: `${controlId}-${id}`,
      inputRef: id === firstId ? inputRef : undefined,
      isModified: value.includes(id) !== savedIds.includes(id),
      onBlur,
      onChange: (checked) =>
        onChange(checked ? [...value, id] : value.filter((chosen) => chosen !== id)),
    };
  }

  return (
    <fieldset className={styles.root} aria-describedby={describedBy}>
      <legend className={styles.legend}>Разделы</legend>
      <div
        className={clsx(
          styles.frame,
          Boolean(error) && styles.frameInvalid,
          disabled && styles.frameDisabled,
        )}
      >
        {sections.length === 0 ? (
          <p className={styles.empty}>Разделов пока нет. Добавьте их на вкладке «Разделы»</p>
        ) : (
          <ul className={styles.list}>
            {sections.map((section) => {
              const subsectionsId = `${controlId}-${section.id}-subsections`;
              const isExpanded = expandedIds.has(section.id);

              return (
                <li key={section.id} className={styles.section}>
                  <div className={styles.row}>
                    <label className={styles.title} htmlFor={`${controlId}-${section.id}`}>
                      {section.title}
                    </label>
                    {section.subsections.length > 0 ? (
                      <button
                        type="button"
                        className={styles.toggle}
                        aria-controls={subsectionsId}
                        aria-expanded={isExpanded}
                        aria-label={`Подразделы: ${section.title}`}
                        onClick={() => toggleExpanded(section.id)}
                      >
                        <ChevronRightIcon
                          className={clsx(styles.chevron, isExpanded && styles.chevronExpanded)}
                        />
                      </button>
                    ) : null}
                    <Checkbox className={styles.checkbox} {...checkboxProps(section.id)} />
                  </div>
                  {section.subsections.length > 0 ? (
                    <ul id={subsectionsId} className={styles.subsections} hidden={!isExpanded}>
                      {section.subsections.map((subsection) => (
                        <li key={subsection.id} className={styles.row}>
                          <ChevronRightIcon className={styles.marker} />
                          <label className={styles.title} htmlFor={`${controlId}-${subsection.id}`}>
                            {subsection.title}
                          </label>
                          <Checkbox className={styles.checkbox} {...checkboxProps(subsection.id)} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <FieldHint id={hintId}>{hint}</FieldHint>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </fieldset>
  );
}
