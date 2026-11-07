import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it } from "vitest";

import { useFormLanguage } from "@/shared/lib/useFormLanguage";

function setUp(address: string) {
  function wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[address]}>{children}</MemoryRouter>;
  }

  return renderHook(() => ({ language: useFormLanguage(), location: useLocation() }), { wrapper });
}

describe("useFormLanguage", () => {
  it("is Russian without a language in the address", () => {
    expect(setUp("/work").result.current.language[0]).toBe("ru");
  });

  it("reads a language from the address and ignores an unknown one", () => {
    expect(setUp("/work?lang=pl").result.current.language[0]).toBe("pl");
    expect(setUp("/work?lang=xx").result.current.language[0]).toBe("ru");
  });

  it("writes the language and keeps the rest of the address", () => {
    const { result } = setUp("/work?sort=title");

    act(() => result.current.language[1]("en"));

    expect(result.current.language[0]).toBe("en");
    expect(result.current.location.search).toBe("?sort=title&lang=en");
  });

  it("leaves Russian out of the address", () => {
    const { result } = setUp("/work?lang=en");

    act(() => result.current.language[1]("ru"));

    expect(result.current.location.search).toBe("");
  });
});
