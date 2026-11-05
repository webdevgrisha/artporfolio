import { readFileSync } from "node:fs";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { changeTheme, currentTheme, themeStorageKey } from "@/features/toggle-theme/model/theme";
import { useTheme } from "@/features/toggle-theme/model/useTheme";

/** Runs the script of index.html, as the browser does before the first paint. */
function runBeforePaintScript() {
  const html = readFileSync("index.html", "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

  new Function(script ?? "")();
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the theme", () => {
  it("is light by default", () => {
    expect(currentTheme()).toBe("light");
  });

  it("is saved and shown", () => {
    changeTheme("dark");

    expect(localStorage.getItem(themeStorageKey)).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("goes back to light without the attribute", () => {
    changeTheme("dark");
    changeTheme("light");

    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem(themeStorageKey)).toBe("light");
  });

  it("still changes where storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    changeTheme("dark");

    expect(currentTheme()).toBe("dark");
  });
});

describe("the script of index.html", () => {
  it("shows the saved dark theme", () => {
    localStorage.setItem(themeStorageKey, "dark");

    runBeforePaintScript();

    expect(currentTheme()).toBe("dark");
  });

  it("leaves the page light without a saved choice", () => {
    runBeforePaintScript();

    expect(currentTheme()).toBe("light");
  });

  it("leaves the page light where storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    runBeforePaintScript();

    expect(currentTheme()).toBe("light");
  });
});

describe("useTheme", () => {
  it("toggles the theme both ways", () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
    expect(currentTheme()).toBe("dark");

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");
    expect(currentTheme()).toBe("light");
  });

  it("follows a change made in another tab", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: themeStorageKey, newValue: "dark" }));
    });

    expect(result.current.theme).toBe("dark");
    expect(currentTheme()).toBe("dark");
  });

  it("ignores other keys of the storage", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: "dark" }));
    });

    expect(result.current.theme).toBe("light");
  });
});
