import { Input } from "@/components/Input/Input";

export function App() {
  return (
    <main className="component-preview">
      <div className="component-preview__input">
        <Input label="Логин" name="login" placeholder="Логин" autoComplete="username" />
      </div>
    </main>
  );
}
