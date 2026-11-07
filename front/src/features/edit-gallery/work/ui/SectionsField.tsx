import clsx from "clsx";
import React from "react";

import type { GallerySectionSummary } from "@/entities/gallery";
import { Checkbox } from "@/shared/ui/checkbox";
import { Fieldset } from "@/shared/ui/fieldset";
import {
  Frame,
  FrameEmpty,
  FrameList,
  FrameListItem,
  FrameRow,
  FrameRowLabel,
} from "@/shared/ui/frame-list";
import { ChevronRightIcon } from "@/shared/ui/icon";

import styles from "./SectionsField.module.css";

interface SectionsFieldProps {
  disabled: boolean;
  error?: string;
  /** Takes the first checkbox, so the form can focus the field when it has an error. */
  inputRef: React.Ref<HTMLInputElement>;
  onBlur: () => void;
  /** Gets the chosen ids. */
  onChange: (ids: string[]) => void;
  /** The ids the form started with, to highlight the checkboxes that differ from them. */
  savedIds: readonly string[];
  /** The sections of the gallery, sorted by title, each followed by its subsections. */
  sections: readonly GallerySectionSummary[];
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
  const controlId = React.useId();
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
    <Fieldset
      className={styles.root}
      legend="Разделы"
      hint="Работа в подразделе видна и в его разделе"
      error={error}
    >
      <Frame className={styles.frame} isInvalid={Boolean(error)} isDisabled={disabled}>
        {sections.length === 0 ? (
          <FrameEmpty>Разделов пока нет. Добавьте их на вкладке «Разделы»</FrameEmpty>
        ) : (
          <FrameList>
            {sections.map((section) => {
              const subsectionsId = `${controlId}-${section.id}-subsections`;
              const isExpanded = expandedIds.has(section.id);

              return (
                <FrameListItem key={section.id}>
                  <FrameRow>
                    <FrameRowLabel htmlFor={`${controlId}-${section.id}`}>
                      {section.title}
                    </FrameRowLabel>
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
                  </FrameRow>
                  {section.subsections.length > 0 ? (
                    <ul id={subsectionsId} className={styles.subsections} hidden={!isExpanded}>
                      {section.subsections.map((subsection) => (
                        <li key={subsection.id}>
                          <FrameRow className={styles.subsection}>
                            <ChevronRightIcon className={styles.marker} />
                            <FrameRowLabel htmlFor={`${controlId}-${subsection.id}`}>
                              {subsection.title}
                            </FrameRowLabel>
                            <Checkbox
                              className={styles.checkbox}
                              {...checkboxProps(subsection.id)}
                            />
                          </FrameRow>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </FrameListItem>
              );
            })}
          </FrameList>
        )}
      </Frame>
    </Fieldset>
  );
}
