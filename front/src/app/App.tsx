import { PasswordInput } from "@/components/PasswordInput/PasswordInput";

export function App() {
  return (
    <main className="component-preview">
      <div className="component-preview__field">
        <PasswordInput
          label="Пароль"
          placeholder="Пароль"
          autoComplete="current-password"
          showPasswordLabel="Показать пароль"
          hidePasswordLabel="Скрыть пароль"
        />
      </div>
    </main>
  );
}
