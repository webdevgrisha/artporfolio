import clsx from "clsx";
import React, { type ReactNode } from "react";

import type { DropTargetProps } from "@/shared/lib/useFileDrop";
import { FieldError, FieldHint } from "@/shared/ui/field";

import styles from "./MediaFieldset.module.css";

interface MediaFieldsetProps {
  /** The files and the controls that pick them, inside the frame. */
  children: ReactNode;
  className?: string;
  disabled: boolean;
  /** Handlers from `useFileDrop`: dropping files is a shortcut for the pointer. */
  dropTargetProps: DropTargetProps;
  error?: string;
  /** Lays out the content of the frame: its padding and gaps. */
  frameClassName?: string;
  hint: string;
  isDragOver: boolean;
  /** Highlights files that differ from the saved ones. An error takes precedence. */
  isModified: boolean;
  label: string;
}

/**
 * The frame of a file field, labelled by a legend, with its hint and error. Files can be dropped
 * onto it; the field's own buttons are the accessible way to pick them.
 */
export function MediaFieldset({
  children,
  className,
  disabled,
  dropTargetProps,
  error,
  frameClassName,
  hint,
  isDragOver,
  isModified,
  label,
}: MediaFieldsetProps) {
  const id = React.useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    // A disabled fieldset also disables every control inside it.
    <fieldset
      className={clsx(styles.root, className)}
      disabled={disabled}
      aria-describedby={error ? `${hintId} ${errorId}` : hintId}
      {...dropTargetProps}
    >
      <legend className={styles.label}>{label}</legend>

      <div
        className={clsx(
          styles.frame,
          frameClassName,
          isModified && styles.frameModified,
          Boolean(error) && styles.frameInvalid,
          isDragOver && styles.frameDragOver,
          disabled && styles.frameDisabled,
        )}
      >
        {children}
      </div>

      <FieldHint id={hintId}>{hint}</FieldHint>
      {/* Announces a rejected file: the focus stays on the button that picked it. */}
      <div aria-live="polite">{error ? <FieldError id={errorId}>{error}</FieldError> : null}</div>
    </fieldset>
  );
}
