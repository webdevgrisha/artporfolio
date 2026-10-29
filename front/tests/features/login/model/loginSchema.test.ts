import { describe, expect, it } from "vitest";

import { loginSchema } from "@/features/login/model/loginSchema";

function messages(values: { email: string; password: string }): string[] {
  return loginSchema.safeParse(values).error?.issues.map((issue) => issue.message) ?? [];
}

describe("loginSchema", () => {
  it("trims the email and keeps the password as typed", () => {
    expect(loginSchema.parse({ email: " admin@example.com ", password: " secret " })).toEqual({
      email: "admin@example.com",
      password: " secret ",
    });
  });

  it("asks for the email and the password", () => {
    expect(messages({ email: " ", password: "" })).toEqual(["Введите логин", "Введите пароль"]);
  });

  it("rejects an invalid email", () => {
    expect(messages({ email: "admin", password: "secret" })).toEqual(["Введите корректный email"]);
  });
});
