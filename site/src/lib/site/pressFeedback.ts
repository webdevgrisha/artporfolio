/**
 * How long a press is shown at least: a click lasts about 80ms, too short to see the answer of a
 * control, so the answer plays this long however short the press, as one lap of the dashes of
 * FramedButton. A longer press is shown for as long as it lasts.
 */
const minimumMilliseconds = 500;

/** The keys that press a button or follow a link from the keyboard. */
const pressKeys = new Set([" ", "Enter"]);

/**
 * Keeps the pressed state of a control marked `data-press` (see «Pressed» in base.css) for at
 * least `minimumMilliseconds`, by `data-pressed`, which its styles read along with `:active`. The
 * browser drops `:active` the moment the press ends; without this script a control still answers
 * through it, only briefly.
 */
export function holdPresses(): void {
  const pressedAt = new WeakMap<HTMLElement, number>();
  const timers = new WeakMap<HTMLElement, number>();
  let current: HTMLElement | undefined;

  function press(control: HTMLElement): void {
    window.clearTimeout(timers.get(control));
    control.dataset.pressed = "";
    pressedAt.set(control, performance.now());
    current = control;
  }

  function release(): void {
    const control = current;

    if (!control) return;

    current = undefined;
    const held = performance.now() - (pressedAt.get(control) ?? 0);
    const timer = window.setTimeout(
      () => {
        delete control.dataset.pressed;
      },
      Math.max(0, minimumMilliseconds - held),
    );
    timers.set(control, timer);
  }

  function controlOf(target: EventTarget | null): HTMLElement | undefined {
    if (!(target instanceof Element)) return undefined;

    const control = target.closest<HTMLElement>("[data-press]");

    return control && !control.matches(":disabled") ? control : undefined;
  }

  document.addEventListener("pointerdown", (event) => {
    // The main button of a mouse, a finger or a pen; not the button of a context menu.
    if (event.button !== 0) return;

    const control = controlOf(event.target);

    if (control) press(control);
  });

  document.addEventListener("keydown", (event) => {
    if (event.repeat || !pressKeys.has(event.key)) return;

    const control = controlOf(event.target);

    if (control) press(control);
  });

  for (const type of ["pointerup", "pointercancel", "keyup", "dragstart"]) {
    document.addEventListener(type, release);
  }
}
