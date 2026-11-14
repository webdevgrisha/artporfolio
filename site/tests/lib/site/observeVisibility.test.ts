import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { observeVisibility } from "@/lib/site/observeVisibility";

describe("observeVisibility", () => {
  const element = {} as Element;
  const observe = vi.fn();
  const disconnect = vi.fn();
  let page: EventTarget & { hidden: boolean };
  let intersect: (visible: boolean) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    page = Object.assign(new EventTarget(), { hidden: false });
    vi.stubGlobal("document", page);
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe = observe;
        disconnect = disconnect;

        constructor(callback: IntersectionObserverCallback) {
          intersect = (visible) =>
            callback(
              [{ target: element, isIntersecting: visible } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver,
            );
        }
      },
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("waits for the first intersection before starting offscreen work", () => {
    const update = vi.fn();
    observeVisibility(element, update);

    expect(observe).toHaveBeenCalledWith(element);
    expect(update).toHaveBeenLastCalledWith(false);
    intersect(true);
    expect(update).toHaveBeenLastCalledWith(true);
    intersect(false);
    expect(update).toHaveBeenLastCalledWith(false);
  });

  it("pauses on a hidden tab and resumes an element still in view", () => {
    const update = vi.fn();
    observeVisibility(element, update);
    intersect(true);

    page.hidden = true;
    page.dispatchEvent(new Event("visibilitychange"));
    expect(update).toHaveBeenLastCalledWith(false);
    page.hidden = false;
    page.dispatchEvent(new Event("visibilitychange"));
    expect(update).toHaveBeenLastCalledWith(true);
  });

  it("does not resume an offscreen element when returning to the tab", () => {
    const update = vi.fn();
    observeVisibility(element, update);
    intersect(false);
    page.hidden = true;
    page.dispatchEvent(new Event("visibilitychange"));
    page.hidden = false;
    page.dispatchEvent(new Event("visibilitychange"));

    expect(update.mock.calls.every(([visible]) => !visible)).toBe(true);
  });

  it("does not start work when an element enters the viewport of a hidden tab", () => {
    page.hidden = true;
    const update = vi.fn();
    observeVisibility(element, update);
    intersect(true);

    expect(update).toHaveBeenLastCalledWith(false);
  });

  it("removes the observer and document listener when disposed", () => {
    const update = vi.fn();
    const dispose = observeVisibility(element, update);
    update.mockClear();
    dispose();
    page.dispatchEvent(new Event("visibilitychange"));

    expect(disconnect).toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
  });
});
