import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/contexts/Auth/AuthProvider";
import { useAuth } from "@/hooks/useAuth";

const auth = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/api/auth", () => ({ getCurrentUser: auth.getCurrentUser }));
vi.mock("@/auth/login", () => ({ login: auth.login }));
vi.mock("@/auth/logout", () => ({ logout: auth.logout }));

const admin = { email: "admin@example.com", uid: "admin-uid" };
let currentAuth: ReturnType<typeof useAuth> | undefined;

function AuthProbe() {
  currentAuth = useAuth();

  if (currentAuth.isLoading) return <p>loading</p>;

  return <p>{currentAuth.user?.email ?? "guest"}</p>;
}

function renderProvider() {
  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
}

beforeEach(() => {
  currentAuth = undefined;
  auth.getCurrentUser.mockResolvedValue(admin);
  auth.login.mockResolvedValue(admin);
  auth.logout.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe("AuthProvider", () => {
  it("restores the current session on mount", async () => {
    renderProvider();

    expect(screen.getByText("loading")).toBeTruthy();
    expect(await screen.findByText(admin.email)).toBeTruthy();
  });

  it("treats a failed session check as a guest", async () => {
    auth.getCurrentUser.mockRejectedValue(new Error("Unauthorized"));

    renderProvider();

    expect(await screen.findByText("guest")).toBeTruthy();
  });

  it("stores the user after login", async () => {
    auth.getCurrentUser.mockRejectedValue(new Error("Unauthorized"));
    renderProvider();
    await screen.findByText("guest");

    await act(() => currentAuth?.login({ email: admin.email, password: "secret" }));

    expect(screen.getByText(admin.email)).toBeTruthy();
  });

  it("clears the user even when logout fails", async () => {
    auth.logout.mockRejectedValue(new Error("Network error"));
    renderProvider();
    await screen.findByText(admin.email);

    await act(async () => {
      await expect(currentAuth?.logout()).rejects.toThrow("Network error");
    });

    await waitFor(() => expect(screen.getByText("guest")).toBeTruthy());
  });
});
